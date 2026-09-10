package br.com.ricardofigueiredo.guarida.animal.dto;

import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.animal.Porte;
import br.com.ricardofigueiredo.guarida.animal.Sexo;
import br.com.ricardofigueiredo.guarida.animal.Temperamento;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

/**
 * A data de entrada nao entra aqui de proposito: ela e um fato do passado, e
 * fato do passado nao se edita. Se tiver sido digitada errada, o caminho e
 * excluir e cadastrar de novo, enquanto o animal ainda nao foi adotado.
 */
public record AtualizarAnimalRequest(

        @NotBlank(message = "todo animal precisa de um nome")
        @Size(max = 60, message = "o nome pode ter no maximo 60 caracteres")
        String nome,

        @NotNull(message = "informe a especie")
        Especie especie,

        @Size(max = 60, message = "a raca pode ter no maximo 60 caracteres")
        String raca,

        @NotNull(message = "informe o sexo")
        Sexo sexo,

        @NotNull(message = "informe o porte")
        Porte porte,

        @NotNull(message = "informe a data de nascimento estimada")
        @PastOrPresent(message = "a data de nascimento nao pode estar no futuro")
        LocalDate nascimentoEstimado,

        @NotNull(message = "informe o peso em gramas")
        // periquito adulto pesa cerca de quarenta gramas, entao o piso nao pode
        // ser de cachorro. O teto cobre o maior cao de raca grande.
        @Min(value = 20, message = "o peso precisa ficar entre 20 g e 120 kg")
        @Max(value = 120_000, message = "o peso precisa ficar entre 20 g e 120 kg")
        Integer pesoEmGramas,

        @Size(max = 1000, message = "a historia pode ter no maximo 1000 caracteres")
        String historia,

        @Size(max = 500, message = "as observacoes podem ter no maximo 500 caracteres")
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
}
