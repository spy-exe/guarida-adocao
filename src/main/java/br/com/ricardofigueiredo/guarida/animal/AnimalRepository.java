package br.com.ricardofigueiredo.guarida.animal;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AnimalRepository extends JpaRepository<Animal, Long>, JpaSpecificationExecutor<Animal> {

    /*
     * O abrigo e os temperamentos sao carregados junto, e nao sob demanda, por
     * dois motivos. O primeiro e desempenho: a resposta mostra o nome do abrigo
     * e os tracos de cada animal, e sem isso cada linha da listagem viraria
     * duas consultas a mais. O segundo e correcao: como a aplicacao roda sem
     * sessao aberta na camada web, um proxy que sobrevivesse ao fim da
     * transacao estouraria na hora de montar a resposta.
     */

    @Override
    @EntityGraph(attributePaths = {"abrigo", "temperamentos"})
    Page<Animal> findAll(Specification<Animal> especificacao, Pageable paginacao);

    @Override
    @EntityGraph(attributePaths = {"abrigo", "temperamentos"})
    List<Animal> findAll(Specification<Animal> especificacao);

    @Override
    @EntityGraph(attributePaths = {"abrigo", "temperamentos"})
    Optional<Animal> findById(Long id);

    @EntityGraph(attributePaths = {"abrigo", "temperamentos"})
    Optional<Animal> findByIdAndAbrigo(Long id, Abrigo abrigo);

    @Query("""
            select
                coalesce(sum(case when a.status = br.com.ricardofigueiredo.guarida.animal.StatusAnimal.DISPONIVEL
                             then 1L else 0L end), 0L),
                coalesce(sum(case when a.status = br.com.ricardofigueiredo.guarida.animal.StatusAnimal.EM_PROCESSO
                             then 1L else 0L end), 0L),
                coalesce(sum(case when a.status = br.com.ricardofigueiredo.guarida.animal.StatusAnimal.ADOTADO
                             then 1L else 0L end), 0L),
                coalesce(sum(case when a.status = br.com.ricardofigueiredo.guarida.animal.StatusAnimal.INDISPONIVEL
                             then 1L else 0L end), 0L),
                count(a)
            from Animal a
            where a.abrigo = :abrigo
            """)
    Object[] contarPorSituacao(@Param("abrigo") Abrigo abrigo);

    @Query("""
            select a.especie, count(a)
            from Animal a
            where a.abrigo = :abrigo
            group by a.especie
            order by count(a) desc
            """)
    List<Object[]> contarPorEspecie(@Param("abrigo") Abrigo abrigo);

    /**
     * Quantos dias, em media, um animal levou entre entrar no abrigo e ser
     * adotado. E o numero que diz se a vitrine esta funcionando.
     */
    @Query(value = """
            select coalesce(avg(cast(e.acontecido - a.data_de_entrada as double precision)), 0)
            from animal a
            join evento_do_animal e on e.animal_id = a.id and e.tipo = 'ADOCAO'
            where a.abrigo_id = :abrigoId
            """, nativeQuery = true)
    Double mediaDeDiasAteAdocao(@Param("abrigoId") Long abrigoId);

    @Query(value = """
            select cast(date_trunc('month', e.acontecido) as date) as mes, count(*)
            from animal a
            join evento_do_animal e on e.animal_id = a.id and e.tipo = 'ADOCAO'
            where a.abrigo_id = :abrigoId and e.acontecido >= :desde
            group by 1
            order by 1
            """, nativeQuery = true)
    List<Object[]> adocoesPorMes(@Param("abrigoId") Long abrigoId, @Param("desde") LocalDate desde);
}
