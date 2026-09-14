package br.com.ricardofigueiredo.guarida.abrigo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistroRequest(

        @NotBlank(message = "informe o nome do abrigo")
        @Size(max = 120, message = "o nome pode ter no máximo 120 caracteres")
        String nome,

        @NotBlank(message = "informe o e-mail")
        @Email(message = "e-mail em formato inválido")
        @Size(max = 160, message = "o e-mail pode ter no máximo 160 caracteres")
        String email,

        @NotBlank(message = "informe a senha")
        @Size(min = 8, max = 64, message = "a senha deve ter entre 8 e 64 caracteres")
        String senha,

        @NotBlank(message = "informe a cidade")
        @Size(max = 80, message = "a cidade pode ter no máximo 80 caracteres")
        String cidade,

        @Pattern(regexp = "[0-9()\\s+-]{0,20}", message = "telefone em formato inválido")
        String telefone) {
}
