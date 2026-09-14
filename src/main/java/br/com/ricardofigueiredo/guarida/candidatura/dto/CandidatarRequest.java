package br.com.ricardofigueiredo.guarida.candidatura.dto;

import br.com.ricardofigueiredo.guarida.candidatura.TipoDeMoradia;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CandidatarRequest(

        @NotBlank(message = "informe seu nome")
        @Size(max = 120, message = "o nome pode ter no máximo 120 caracteres")
        String nome,

        @NotBlank(message = "informe seu e-mail")
        @Email(message = "e-mail em formato inválido")
        @Size(max = 160, message = "o e-mail pode ter no máximo 160 caracteres")
        String email,

        @NotBlank(message = "informe um telefone com DDD")
        @Pattern(regexp = "[0-9()\\s+-]{10,20}", message = "telefone em formato inválido")
        String telefone,

        @NotBlank(message = "informe sua cidade")
        @Size(max = 80, message = "a cidade pode ter no máximo 80 caracteres")
        String cidade,

        @NotNull(message = "informe o tipo de moradia")
        TipoDeMoradia moradia,

        @NotNull(message = "diga se a casa tem tela, muro ou cerca")
        Boolean areaProtegida,

        @NotNull(message = "diga se você já tem outros animais")
        Boolean temOutrosAnimais,

        @Size(max = 800, message = "a mensagem pode ter no máximo 800 caracteres")
        String mensagem) {
}
