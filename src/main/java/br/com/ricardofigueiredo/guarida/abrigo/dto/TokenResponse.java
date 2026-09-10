package br.com.ricardofigueiredo.guarida.abrigo.dto;

import java.time.Instant;

public record TokenResponse(String token, String tipo, Instant expiraEm) {

    public static TokenResponse bearer(String token, Instant expiraEm) {
        return new TokenResponse(token, "Bearer", expiraEm);
    }
}
