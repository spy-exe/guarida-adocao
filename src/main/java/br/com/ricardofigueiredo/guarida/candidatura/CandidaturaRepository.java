package br.com.ricardofigueiredo.guarida.candidatura;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.Animal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CandidaturaRepository extends JpaRepository<Candidatura, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"animal", "animal.abrigo"})
    List<Candidatura> findByAnimalOrderByCriadaEmDesc(Animal animal);

    long countByAnimalAndStatusIn(Animal animal, List<StatusDaCandidatura> status);

    void deleteByAnimal(Animal animal);

    @Query("""
            select c from Candidatura c
            join fetch c.animal a
            join fetch a.abrigo
            where a.abrigo = :abrigo and (:status is null or c.status = :status)
            order by c.criadaEm desc
            """)
    Page<Candidatura> doAbrigo(@Param("abrigo") Abrigo abrigo,
                               @Param("status") StatusDaCandidatura status,
                               Pageable paginacao);

    @Query("""
            select c from Candidatura c
            join fetch c.animal a
            join fetch a.abrigo
            where c.id = :id and a.abrigo = :abrigo
            """)
    Optional<Candidatura> doAbrigoPorId(@Param("id") Long id, @Param("abrigo") Abrigo abrigo);
}
