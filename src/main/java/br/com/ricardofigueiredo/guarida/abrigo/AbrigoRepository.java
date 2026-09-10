package br.com.ricardofigueiredo.guarida.abrigo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AbrigoRepository extends JpaRepository<Abrigo, Long> {

    Optional<Abrigo> findByEmail(String email);

    boolean existsByEmail(String email);
}
