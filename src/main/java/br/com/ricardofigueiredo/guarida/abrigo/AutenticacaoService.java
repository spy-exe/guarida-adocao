package br.com.ricardofigueiredo.guarida.abrigo;

import br.com.ricardofigueiredo.guarida.abrigo.dto.LoginRequest;
import br.com.ricardofigueiredo.guarida.abrigo.dto.RegistroRequest;
import br.com.ricardofigueiredo.guarida.abrigo.dto.TokenResponse;
import br.com.ricardofigueiredo.guarida.comum.excecao.ConflitoException;
import br.com.ricardofigueiredo.guarida.seguranca.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
public class AutenticacaoService {

    private final AbrigoRepository abrigoRepository;
    private final PasswordEncoder codificadorDeSenha;
    private final AuthenticationManager gerenciadorDeAutenticacao;
    private final JwtService jwtService;

    public AutenticacaoService(AbrigoRepository abrigoRepository,
                               PasswordEncoder codificadorDeSenha,
                               AuthenticationManager gerenciadorDeAutenticacao,
                               JwtService jwtService) {
        this.abrigoRepository = abrigoRepository;
        this.codificadorDeSenha = codificadorDeSenha;
        this.gerenciadorDeAutenticacao = gerenciadorDeAutenticacao;
        this.jwtService = jwtService;
    }

    @Transactional
    public Abrigo registrar(RegistroRequest requisicao) {
        String email = normalizar(requisicao.email());

        if (abrigoRepository.existsByEmail(email)) {
            throw new ConflitoException("Ja existe um abrigo cadastrado com este e-mail.");
        }

        return abrigoRepository.save(new Abrigo(
                requisicao.nome().trim(),
                email,
                codificadorDeSenha.encode(requisicao.senha()),
                requisicao.cidade().trim(),
                requisicao.telefone() == null || requisicao.telefone().isBlank()
                        ? null : requisicao.telefone().trim()));
    }

    public TokenResponse autenticar(LoginRequest requisicao) {
        String email = normalizar(requisicao.email());
        gerenciadorDeAutenticacao.authenticate(
                new UsernamePasswordAuthenticationToken(email, requisicao.senha()));

        Instant expiraEm = jwtService.expiracaoAPartirDeAgora();
        return TokenResponse.bearer(jwtService.gerarToken(email, expiraEm), expiraEm);
    }

    private String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
