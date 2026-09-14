package br.com.ricardofigueiredo.guarida.animal.dto;

import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.animal.Porte;
import br.com.ricardofigueiredo.guarida.animal.Sexo;
import br.com.ricardofigueiredo.guarida.animal.Temperamento;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record CadastrarAnimalRequest(

        @NotBlank(message = "todo animal precisa de um nome, nem que seja provisorio")
        @Size(max = 60, message = "o nome pode ter no máximo 60 caracteres")
        String nome,

        @NotNull(message = "informe a espécie")
        Especie especie,

        @Size(max = 60, message = "a raça pode ter no máximo 60 caracteres")
        String raca,

        @NotNull(message = "informe o sexo")
        Sexo sexo,

        @NotNull(message = "informe o porte")
        Porte porte,

        @NotNull(message = "informe a data de nascimento estimada")
        @PastOrPresent(message = "a data de nascimento não pode estar no futuro")
        LocalDate nascimentoEstimado,

        @NotNull(message = "informe o peso em gramas")
        // periquito adulto pesa cerca de quarenta gramas, entao o piso nao pode
        // ser de cachorro. O teto cobre o maior cao de raca grande.
        @Min(value = 20, message = "o peso precisa ficar entre 20 g e 120 kg")
        @Max(value = 120_000, message = "o peso precisa ficar entre 20 g e 120 kg")
        Integer pesoEmGramas,

        @NotNull(message = "informe a data de entrada no abrigo")
        @PastOrPresent(message = "a data de entrada não pode estar no futuro")
        LocalDate dataDeEntrada,

        @Size(max = 1000, message = "a história pode ter no máximo 1000 caracteres")
        String historia,

        @Size(max = 500, message = "as observações podem ter no máximo 500 caracteres")
        String observacoesDeSaude,

        Boolean castrado,
        Boolean vacinado,
        Boolean vermifugado,

        Set<Temperamento> temperamentos) {

    public boolean castradoOuNao() {
        return Boolean.TRUE.equals(castrado);
    }

    public boolean vacinadoOuNao() {
        return Boolean.TRUE.equals(vacinado);
    }

    public boolean vermifugadoOuNao() {
        return Boolean.TRUE.equals(vermifugado);
    }

    @JsonIgnore
    @AssertTrue(message = "o animal não pode ter entrado no abrigo antes de nascer")
    public boolean isEntradaDepoisDoNascimento() {
        if (dataDeEntrada == null || nascimentoEstimado == null) {
            return true;
        }
        return !dataDeEntrada.isBefore(nascimentoEstimado);
    }
}
