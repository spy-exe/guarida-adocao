package br.com.ricardofigueiredo.guarida.config;

import br.com.ricardofigueiredo.guarida.seguranca.FiltroAutenticacaoJwt;
import br.com.ricardofigueiredo.guarida.seguranca.RespostaNaoAutorizado;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * O catalogo e publico de proposito: procurar um animal para adotar nao pode
 * exigir cadastro. O que muda a vida de um bicho, por outro lado, so o abrigo
 * dono faz, e por isso cadastrar, alterar e excluir pedem token.
 */
@Configuration
@EnableWebSecurity
public class SegurancaConfig {

    private static final String[] SEMPRE_PUBLICAS = {
            "/api/v1/autenticacao/registro",
            "/api/v1/autenticacao/login",
            "/saude",
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-ui.html",
            "/swagger-ui/**"
    };

    private final FiltroAutenticacaoJwt filtroAutenticacaoJwt;
    private final RespostaNaoAutorizado respostaNaoAutorizado;

    public SegurancaConfig(FiltroAutenticacaoJwt filtroAutenticacaoJwt,
                           RespostaNaoAutorizado respostaNaoAutorizado) {
        this.filtroAutenticacaoJwt = filtroAutenticacaoJwt;
        this.respostaNaoAutorizado = respostaNaoAutorizado;
    }

    @Bean
    public SecurityFilterChain cadeiaDeFiltros(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(rotas -> rotas
                        .requestMatchers(SEMPRE_PUBLICAS).permitAll()
                        // o catalogo e a ficha de cada animal ficam abertos
                        .requestMatchers(HttpMethod.GET, "/api/v1/animais", "/api/v1/animais/*",
                                "/api/v1/animais/*/eventos", "/api/v1/animais/*/foto").permitAll()
                        // qualquer pessoa pode se candidatar a adotar
                        .requestMatchers(HttpMethod.POST, "/api/v1/animais/*/candidaturas").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(erros -> erros.authenticationEntryPoint(respostaNaoAutorizado))
                .addFilterBefore(filtroAutenticacaoJwt, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder codificadorDeSenha() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager gerenciadorDeAutenticacao(AuthenticationConfiguration configuracao)
            throws Exception {
        return configuracao.getAuthenticationManager();
    }
}
