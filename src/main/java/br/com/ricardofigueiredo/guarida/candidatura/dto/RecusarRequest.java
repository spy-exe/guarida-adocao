package br.com.ricardofigueiredo.guarida.candidatura.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecusarRequest(

        @NotBlank(message = "escreva o motivo da recusa")
        @Size(max = 300, message = "o motivo pode ter no maximo 300 caracteres")
        String motivo) {
}
