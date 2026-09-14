package br.com.ricardofigueiredo.guarida.animal.dto;

import br.com.ricardofigueiredo.guarida.animal.TipoDeEvento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegistrarEventoRequest(

        @NotNull(message = "informe o tipo do evento")
        TipoDeEvento tipo,

        @NotBlank(message = "descreva o que aconteceu")
        @Size(max = 300, message = "a descricao pode ter no máximo 300 caracteres")
        String descricao,

        @PastOrPresent(message = "o evento não pode ter acontecido no futuro")
        LocalDate acontecido) {
}
