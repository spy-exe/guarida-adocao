package br.com.ricardofigueiredo.guarida.seguranca;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Le o cabecalho Authorization, valida o token e coloca o abrigo no contexto de
 * seguranca. Requisicao sem token segue adiante: quem barra e o
 * SecurityFilterChain, e so nas rotas que exigem dono.
 */
@Component
public class FiltroAutenticacaoJwt extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final JwtService jwtService;
    private final DetalhesDoAbrigoService detalhesDoAbrigoService;

    public FiltroAutenticacaoJwt(JwtService jwtService, DetalhesDoAbrigoService detalhesDoAbrigoService) {
        this.jwtService = jwtService;
        this.detalhesDoAbrigoService = detalhesDoAbrigoService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest requisicao, HttpServletResponse resposta,
                                    FilterChain cadeia) throws ServletException, IOException {
        String cabecalho = requisicao.getHeader(HttpHeaders.AUTHORIZATION);

        if (cabecalho != null && cabecalho.startsWith(PREFIXO)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String token = cabecalho.substring(PREFIXO.length()).trim();
            jwtService.emailDoToken(token).ifPresent(email -> autenticar(email, requisicao));
        }

        cadeia.doFilter(requisicao, resposta);
    }

    private void autenticar(String email, HttpServletRequest requisicao) {
        try {
            UserDetails abrigo = detalhesDoAbrigoService.loadUserByUsername(email);
            var autenticacao = new UsernamePasswordAuthenticationToken(abrigo, null, abrigo.getAuthorities());
            autenticacao.setDetails(new WebAuthenticationDetailsSource().buildDetails(requisicao));
            SecurityContextHolder.getContext().setAuthentication(autenticacao);
        } catch (UsernameNotFoundException excecao) {
            SecurityContextHolder.clearContext();
        }
    }
}
