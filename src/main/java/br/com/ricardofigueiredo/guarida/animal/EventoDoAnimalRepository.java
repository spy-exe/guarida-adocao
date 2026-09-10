package br.com.ricardofigueiredo.guarida.animal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoDoAnimalRepository extends JpaRepository<EventoDoAnimal, Long> {

    List<EventoDoAnimal> findByAnimalOrderByAcontecidoAscIdAsc(Animal animal);

    void deleteByAnimal(Animal animal);
}
