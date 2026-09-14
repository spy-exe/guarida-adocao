package br.com.ricardofigueiredo.guarida.foto;

import br.com.ricardofigueiredo.guarida.animal.Animal;
import br.com.ricardofigueiredo.guarida.animal.dto.AnimalResponse;
import br.com.ricardofigueiredo.guarida.comum.PaginaResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Monta a resposta do animal ja com o credito da foto.
 *
 * A pagina inteira custa uma consulta a mais, e nao uma por animal: os ids da
 * pagina vao juntos em um unico "in", e so as colunas leves voltam.
 */
@Component
public class RespostasDeAnimal {

    private final FotoRepository fotoRepository;

    public RespostasDeAnimal(FotoRepository fotoRepository) {
        this.fotoRepository = fotoRepository;
    }

    @Transactional(readOnly = true)
    public AnimalResponse uma(Animal animal) {
        CreditoDaFoto credito = fotoRepository.creditosDe(List.of(animal.getId())).stream()
                .findFirst()
                .orElse(null);
        return AnimalResponse.de(animal, credito);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AnimalResponse> pagina(Page<Animal> pagina) {
        List<Long> ids = pagina.getContent().stream().map(Animal::getId).toList();

        Map<Long, CreditoDaFoto> porAnimal = ids.isEmpty()
                ? Map.of()
                : fotoRepository.creditosDe(ids).stream()
                        .collect(Collectors.toMap(CreditoDaFoto::animalId, Function.identity()));

        return PaginaResponse.de(pagina, animal -> AnimalResponse.de(animal, porAnimal.get(animal.getId())));
    }
}
