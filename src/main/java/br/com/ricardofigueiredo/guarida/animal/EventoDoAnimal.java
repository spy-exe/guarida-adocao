package br.com.ricardofigueiredo.guarida.animal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Cada coisa que aconteceu com o animal. Serve tanto para o abrigo lembrar
 * quando foi a ultima vacina quanto para quem adota receber a historia inteira
 * junto com o bicho.
 */
@Entity
@Table(name = "evento_do_animal")
public class EventoDoAnimal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDeEvento tipo;

    @Column(nullable = false, length = 300)
    private String descricao;

    @Column(nullable = false)
    private LocalDate acontecido;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    protected EventoDoAnimal() {
    }

    public EventoDoAnimal(Animal animal, TipoDeEvento tipo, String descricao, LocalDate acontecido) {
        this.animal = animal;
        this.tipo = tipo;
        this.descricao = descricao;
        this.acontecido = acontecido == null ? LocalDate.now() : acontecido;
        this.criadoEm = Instant.now();
    }

    public TipoDeEvento getTipo() {
        return tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public LocalDate getAcontecido() {
        return acontecido;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }
}
