package br.com.ricardofigueiredo.guarida.animal;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.text.Normalizer;
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
            String alvo = semAcento(filtro.cidade());
            criterios.add((raiz, consulta, cb) ->
                    cb.equal(normalizado(cb, raiz.join("abrigo", JoinType.INNER).get("cidade")), alvo));
        }
        if (temTexto(filtro.busca())) {
            String alvo = "%" + semAcento(filtro.busca()) + "%";
            criterios.add((raiz, consulta, cb) -> cb.or(
                    cb.like(normalizado(cb, raiz.get("nome")), alvo),
                    cb.like(normalizado(cb, cb.coalesce(raiz.get("raca"), "")), alvo),
                    cb.like(normalizado(cb, cb.coalesce(raiz.get("historia"), "")), alvo)));
        }

        return Specification.allOf(criterios);
    }

    /*
     * Quem procura digita "niteroi" e espera achar o abrigo de Niteroi com
     * acento. A comparacao entao tira acento dos dois lados: do termo, aqui no
     * Java, e da coluna, com translate, que o PostgreSQL e o H2 dos testes
     * entendem igual. Assim a regra e a mesma nos dois bancos.
     */
    private static final String COM_ACENTO = "áàâãäéèêëíìîïóòôõöúùûüç";
    private static final String SEM_ACENTO = "aaaaaeeeeiiiiooooouuuuc";

    static String semAcento(String texto) {
        String minusculo = texto.trim().toLowerCase(Locale.ROOT);
        return Normalizer.normalize(minusculo, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    private static Expression<String> normalizado(CriteriaBuilder cb, Expression<String> coluna) {
        return cb.function("translate", String.class, cb.lower(coluna),
                cb.literal(COM_ACENTO), cb.literal(SEM_ACENTO));
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }
}
