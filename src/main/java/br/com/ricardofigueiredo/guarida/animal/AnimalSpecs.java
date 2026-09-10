package br.com.ricardofigueiredo.guarida.animal;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Filtros do catalogo montados como Specification. A alternativa seria uma
 * derived query por combinacao, que dobra a cada filtro novo. Aqui cada
 * criterio e independente e some sozinho quando nao foi informado.
 */
public final class AnimalSpecs {

    private AnimalSpecs() {
    }

    public record Filtro(Especie especie, Porte porte, Sexo sexo, StatusAnimal status,
                         Temperamento temperamento, Boolean apenasFilhotes, String cidade, String busca) {
    }

    public static Specification<Animal> doCatalogo(Filtro filtro) {
        return montar(null, filtro);
    }

    public static Specification<Animal> doAbrigo(Abrigo abrigo, Filtro filtro) {
        return montar(abrigo, filtro);
    }

    private static Specification<Animal> montar(Abrigo abrigo, Filtro filtro) {
        List<Specification<Animal>> criterios = new ArrayList<>();

        if (abrigo != null) {
            criterios.add((raiz, consulta, cb) -> cb.equal(raiz.get("abrigo"), abrigo));
        }
        if (filtro.especie() != null) {
            criterios.add((raiz, consulta, cb) -> cb.equal(raiz.get("especie"), filtro.especie()));
        }
        if (filtro.porte() != null) {
            criterios.add((raiz, consulta, cb) -> cb.equal(raiz.get("porte"), filtro.porte()));
        }
        if (filtro.sexo() != null) {
            criterios.add((raiz, consulta, cb) -> cb.equal(raiz.get("sexo"), filtro.sexo()));
        }
        if (filtro.status() != null) {
            criterios.add((raiz, consulta, cb) -> cb.equal(raiz.get("status"), filtro.status()));
        }
        if (filtro.temperamento() != null) {
            criterios.add((raiz, consulta, cb) ->
                    cb.isMember(filtro.temperamento(), raiz.get("temperamentos")));
        }
        if (Boolean.TRUE.equals(filtro.apenasFilhotes())) {
            LocalDate umAnoAtras = LocalDate.now().minusYears(1);
            criterios.add((raiz, consulta, cb) ->
                    cb.greaterThan(raiz.get("nascimentoEstimado"), umAnoAtras));
        }
        if (temTexto(filtro.cidade())) {
            String alvo = filtro.cidade().trim().toLowerCase(Locale.ROOT);
            criterios.add((raiz, consulta, cb) ->
                    cb.equal(cb.lower(raiz.join("abrigo", JoinType.INNER).get("cidade")), alvo));
        }
        if (temTexto(filtro.busca())) {
            String alvo = "%" + filtro.busca().trim().toLowerCase(Locale.ROOT) + "%";
            criterios.add((raiz, consulta, cb) -> cb.or(
                    cb.like(cb.lower(raiz.get("nome")), alvo),
                    cb.like(cb.lower(cb.coalesce(raiz.get("raca"), "")), alvo),
                    cb.like(cb.lower(cb.coalesce(raiz.get("historia"), "")), alvo)));
        }

        return Specification.allOf(criterios);
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }
}
