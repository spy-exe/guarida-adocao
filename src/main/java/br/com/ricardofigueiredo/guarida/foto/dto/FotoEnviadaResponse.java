package br.com.ricardofigueiredo.guarida.foto.dto;

import br.com.ricardofigueiredo.guarida.foto.FotoDoAnimal;

import java.time.Instant;

public record FotoEnviadaResponse(String url, String tipo, int tamanho, String autor, String licenca,
                                  String fonte, Instant atualizadaEm) {

    public static FotoEnviadaResponse de(FotoDoAnimal foto) {
        return new FotoEnviadaResponse(
                "/api/v1/animais/" + foto.getAnimalId() + "/foto?v=" + foto.getVersao(),
                foto.getTipo(), foto.getTamanho(), foto.getAutor(), foto.getLicenca(), foto.getFonte(),
                foto.getAtualizadaEm());
    }
}
