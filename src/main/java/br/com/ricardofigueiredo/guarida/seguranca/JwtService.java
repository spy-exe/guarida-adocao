package br.com.ricardofigueiredo.guarida.seguranca;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Emissao e leitura dos tokens. A assinatura usa HMAC-SHA256 com o segredo de
 * guarida.jwt.segredo, que em producao vem de variavel de ambiente e nunca do
 * repositorio.
 */
@Service
public class JwtService {

    private final SecretKey chave;
    private final Duration validade;

    public JwtService(@Value("${guarida.jwt.segredo}") String segredo,
                      @Value("${guarida.jwt.validade-minutos}") long validadeMinutos) {
        this.chave = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
        this.validade = Duration.ofMinutes(validadeMinutos);
    }

    public Instant expiracaoAPartirDeAgora() {
        return Instant.now().plus(validade);
    }

    public String gerarToken(String email, Instant expiraEm) {
        return Jwts.builder()
                .subject(email)
                .issuer("guarida")
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiraEm))
                .signWith(chave)
                .compact();
    }

    /**
     * Devolve o e-mail do dono do token, ou vazio se ele estiver expirado,
     * adulterado ou assinado com outra chave.
     */
    public Optional<String> emailDoToken(String token) {
        try {
            return Optional.ofNullable(Jwts.parser()
                    .verifyWith(chave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject());
        } catch (JwtException | IllegalArgumentException excecao) {
            return Optional.empty();
        }
    }
}
