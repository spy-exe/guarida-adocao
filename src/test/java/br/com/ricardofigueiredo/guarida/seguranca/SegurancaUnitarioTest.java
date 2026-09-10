package br.com.ricardofigueiredo.guarida.seguranca;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.abrigo.AbrigoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Caminhos de borda da autenticacao, dificeis de alcancar pelo teste de fluxo. */
class SegurancaUnitarioTest {

    private static final String SEGREDO = "segredo-de-teste-com-mais-de-trinta-e-dois-bytes-01234";

    private final JwtService jwtService = new JwtService(SEGREDO, 240);

    @AfterEach
    void limparContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("token adulterado, expirado ou de outra chave nao devolve e-mail")
    void tokenInvalidoNaoAbre() {
        String valido = jwtService.gerarToken("abrigo@exemplo.com", Instant.now().plusSeconds(60));

        assertThat(jwtService.emailDoToken(valido)).contains("abrigo@exemplo.com");
        assertThat(jwtService.emailDoToken("nao e um token")).isEmpty();
        assertThat(jwtService.emailDoToken("")).isEmpty();

        // trocar um caractere da assinatura muda os bytes de verdade. Acrescentar
        // um caractere no fim nao serviria: o decodificador base64url devolve os
        // mesmos trinta e dois bytes, e a assinatura continua sendo a mesma.
        assertThat(jwtService.emailDoToken(comAssinaturaTrocada(valido))).isEmpty();

        // mexer no corpo tambem derruba, que e o que de fato importa
        String[] partes = valido.split("\\.");
        String corpoTrocado = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"invasor@exemplo.com\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(jwtService.emailDoToken(partes[0] + "." + corpoTrocado + "." + partes[2])).isEmpty();

        String expirado = jwtService.gerarToken("abrigo@exemplo.com", Instant.now().minusSeconds(60));
        assertThat(jwtService.emailDoToken(expirado)).isEmpty();

        String deOutraChave = new JwtService("outro-segredo-com-mais-de-trinta-e-dois-bytes-0123456", 240)
                .gerarToken("abrigo@exemplo.com", Instant.now().plusSeconds(60));
        assertThat(jwtService.emailDoToken(deOutraChave)).isEmpty();
    }

    @Test
    @DisplayName("a validade sai do que foi configurado")
    void validadeConfigurada() {
        assertThat(jwtService.expiracaoAPartirDeAgora())
                .isBetween(Instant.now().plusSeconds(230 * 60), Instant.now().plusSeconds(241 * 60));
    }

    @Test
    @DisplayName("o servico de detalhes recusa e-mail que nao existe")
    void abrigoInexistente() {
        AbrigoRepository repositorio = mock(AbrigoRepository.class);
        when(repositorio.findByEmail("ninguem@exemplo.com")).thenReturn(Optional.empty());

        DetalhesDoAbrigoService servico = new DetalhesDoAbrigoService(repositorio);

        assertThatThrownBy(() -> servico.loadUserByUsername("ninguem@exemplo.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("o abrigo autenticado carrega e-mail e hash de senha para o Spring Security")
    void detalhesDoAbrigo() {
        Abrigo abrigo = new Abrigo("Abrigo", "abrigo@exemplo.com", "hash", "Niteroi", null);
        AbrigoAutenticado autenticado = new AbrigoAutenticado(abrigo);

        assertThat(autenticado.getUsername()).isEqualTo("abrigo@exemplo.com");
        assertThat(autenticado.getPassword()).isEqualTo("hash");
        assertThat(autenticado.getAuthorities()).isEmpty();
        assertThat(autenticado.getAbrigo()).isSameAs(abrigo);
    }

    @Test
    @DisplayName("requisicao sem cabecalho segue adiante sem autenticar")
    void semCabecalhoNaoAutentica() throws Exception {
        FilterChain cadeia = mock(FilterChain.class);
        filtro(mock(DetalhesDoAbrigoService.class))
                .doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), cadeia);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(cadeia).doFilter(any(HttpServletRequest.class), any(HttpServletResponse.class));
    }

    @Test
    @DisplayName("cabecalho sem o prefixo Bearer e ignorado")
    void cabecalhoSemPrefixoNaoAutentica() throws Exception {
        MockHttpServletRequest requisicao = new MockHttpServletRequest();
        requisicao.addHeader(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpzZW5oYQ==");

        filtro(mock(DetalhesDoAbrigoService.class))
                .doFilter(requisicao, new MockHttpServletResponse(), mock(FilterChain.class));

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("token valido coloca o abrigo no contexto")
    void tokenValidoAutentica() throws Exception {
        Abrigo abrigo = new Abrigo("Abrigo", "abrigo@exemplo.com", "hash", "Niteroi", null);
        DetalhesDoAbrigoService detalhes = mock(DetalhesDoAbrigoService.class);
        when(detalhes.loadUserByUsername("abrigo@exemplo.com")).thenReturn(new AbrigoAutenticado(abrigo));

        MockHttpServletRequest requisicao = new MockHttpServletRequest();
        requisicao.addHeader(HttpHeaders.AUTHORIZATION,
                "Bearer " + jwtService.gerarToken("abrigo@exemplo.com", Instant.now().plusSeconds(60)));

        filtro(detalhes).doFilter(requisicao, new MockHttpServletResponse(), mock(FilterChain.class));

        assertThat(SecurityContextHolder.getContext().getAuthentication().getName())
                .isEqualTo("abrigo@exemplo.com");
    }

    @Test
    @DisplayName("token de abrigo que foi removido limpa o contexto em vez de estourar")
    void abrigoRemovidoLimpaOContexto() throws Exception {
        DetalhesDoAbrigoService detalhes = mock(DetalhesDoAbrigoService.class);
        when(detalhes.loadUserByUsername("sumiu@exemplo.com"))
                .thenThrow(new UsernameNotFoundException("sumiu"));

        MockHttpServletRequest requisicao = new MockHttpServletRequest();
        requisicao.addHeader(HttpHeaders.AUTHORIZATION,
                "Bearer " + jwtService.gerarToken("sumiu@exemplo.com", Instant.now().plusSeconds(60)));

        filtro(detalhes).doFilter(requisicao, new MockHttpServletResponse(), mock(FilterChain.class));

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("contexto ja autenticado nao e sobrescrito")
    void contextoJaAutenticadoNaoMuda() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("outro", null, List.of()));

        MockHttpServletRequest requisicao = new MockHttpServletRequest();
        requisicao.addHeader(HttpHeaders.AUTHORIZATION,
                "Bearer " + jwtService.gerarToken("abrigo@exemplo.com", Instant.now().plusSeconds(60)));

        filtro(mock(DetalhesDoAbrigoService.class))
                .doFilter(requisicao, new MockHttpServletResponse(), mock(FilterChain.class));

        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("outro");
    }

    @Test
    @DisplayName("a resposta de 401 sai em JSON no formato de problema")
    void respostaDeNaoAutorizado() throws Exception {
        MockHttpServletResponse resposta = new MockHttpServletResponse();

        new RespostaNaoAutorizado(new ObjectMapper())
                .commence(new MockHttpServletRequest(), resposta, null);

        assertThat(resposta.getStatus()).isEqualTo(401);
        assertThat(resposta.getContentType()).isEqualTo("application/problem+json");
        assertThat(resposta.getContentAsString()).contains("Nao autenticado");
    }

    private String comAssinaturaTrocada(String token) {
        char ultimo = token.charAt(token.length() - 1);
        char trocado = ultimo == 'A' ? 'B' : 'A';
        return token.substring(0, token.length() - 1) + trocado;
    }

    private FiltroAutenticacaoJwt filtro(DetalhesDoAbrigoService detalhes) {
        return new FiltroAutenticacaoJwt(jwtService, detalhes);
    }
}
