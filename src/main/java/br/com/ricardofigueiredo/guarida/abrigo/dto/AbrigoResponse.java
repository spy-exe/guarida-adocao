package br.com.ricardofigueiredo.guarida.abrigo.dto;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;

import java.time.Instant;

public record AbrigoResponse(Long id, String nome, String email, String cidade, String telefone,
                             Instant criadoEm) {

    public static AbrigoResponse de(Abrigo abrigo) {
        return new AbrigoResponse(abrigo.getId(), abrigo.getNome(), abrigo.getEmail(),
                abrigo.getCidade(), abrigo.getTelefone(), abrigo.getCriadoEm());
    }
}
