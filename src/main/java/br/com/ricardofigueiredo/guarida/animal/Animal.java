package br.com.ricardofigueiredo.guarida.animal;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import java.time.Period;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * O animal e a raiz do sistema. As regras de mudanca de situacao ficam aqui, e
 * nao no service, para que nenhuma camada consiga colocar o cadastro em um
 * estado que o abrigo nao saberia justificar, como entregar para adocao um
 * animal que ja foi adotado.
 */
@Entity
@Table(name = "animal")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "abrigo_id", nullable = false)
    private Abrigo abrigo;

    @Column(nullable = false, length = 60)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Especie especie;

    @Column(length = 60)
    private String raca;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sexo sexo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Porte porte;

    @Column(name = "nascimento_estimado", nullable = false)
    private LocalDate nascimentoEstimado;

    @Column(name = "peso_em_gramas", nullable = false)
    private int pesoEmGramas;

    @Column(nullable = false)
    private boolean castrado;

    @Column(nullable = false)
    private boolean vacinado;

    @Column(nullable = false)
    private boolean vermifugado;

    @Column(length = 1000)
    private String historia;

    @Column(name = "observacoes_de_saude", length = 500)
    private String observacoesDeSaude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAnimal status;

    @Column(name = "data_de_entrada", nullable = false)
    private LocalDate dataDeEntrada;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "temperamento_do_animal", joinColumns = @JoinColumn(name = "animal_id"))
    @Column(name = "temperamento", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<Temperamento> temperamentos = new LinkedHashSet<>();

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected Animal() {
    }

    public Animal(Abrigo abrigo, String nome, Especie especie, String raca, Sexo sexo, Porte porte,
                  LocalDate nascimentoEstimado, int pesoEmGramas, LocalDate dataDeEntrada) {
        this.abrigo = abrigo;
        this.nome = nome;
        this.especie = especie;
        this.raca = raca;
        this.sexo = sexo;
        this.porte = porte;
        this.nascimentoEstimado = nascimentoEstimado;
        this.pesoEmGramas = pesoEmGramas;
        this.dataDeEntrada = dataDeEntrada;
        this.status = StatusAnimal.DISPONIVEL;
        this.criadoEm = Instant.now();
        this.atualizadoEm = this.criadoEm;
    }

    /** Idade em meses, calculada a partir do nascimento estimado. */
    public int idadeEmMeses() {
        Period intervalo = Period.between(nascimentoEstimado, LocalDate.now());
        return Math.max(intervalo.getYears() * 12 + intervalo.getMonths(), 0);
    }

    public boolean filhote() {
        return idadeEmMeses() < 12;
    }

    public void editar(String nome, Especie especie, String raca, Sexo sexo, Porte porte,
                       LocalDate nascimentoEstimado, int pesoEmGramas, String historia,
                       String observacoesDeSaude, boolean castrado, boolean vacinado, boolean vermifugado,
                       Set<Temperamento> temperamentos) {
        this.nome = nome;
        this.especie = especie;
        this.raca = raca;
        this.sexo = sexo;
        this.porte = porte;
        this.nascimentoEstimado = nascimentoEstimado;
        this.pesoEmGramas = pesoEmGramas;
        this.historia = historia;
        this.observacoesDeSaude = observacoesDeSaude;
        this.castrado = castrado;
        this.vacinado = vacinado;
        this.vermifugado = vermifugado;
        this.temperamentos = temperamentos == null ? new LinkedHashSet<>() : new LinkedHashSet<>(temperamentos);
        marcarAlteracao();
    }

    /** Uma candidatura foi aprovada: o animal sai da vitrine e entra em processo. */
    public void reservar() {
        if (status != StatusAnimal.DISPONIVEL) {
            throw new RegraDeNegocioException(
                    "So um animal disponivel pode entrar em processo de adocao. Situacao atual: "
                            + status.getRotulo() + ".");
        }
        this.status = StatusAnimal.EM_PROCESSO;
        marcarAlteracao();
    }

    /** A entrega aconteceu. Daqui o cadastro so sai por devolucao. */
    public void concluirAdocao() {
        if (status != StatusAnimal.EM_PROCESSO) {
            throw new RegraDeNegocioException(
                    "A adocao so pode ser concluida depois de aprovar uma candidatura. Situacao atual: "
                            + status.getRotulo() + ".");
        }
        this.status = StatusAnimal.ADOTADO;
        marcarAlteracao();
    }

    public void devolverParaAdocao() {
        if (status == StatusAnimal.DISPONIVEL) {
            throw new RegraDeNegocioException("O animal ja esta disponivel.");
        }
        this.status = StatusAnimal.DISPONIVEL;
        marcarAlteracao();
    }

    /** Tratamento, quarentena ou qualquer motivo que tire o animal da vitrine. */
    public void suspender() {
        if (status == StatusAnimal.ADOTADO) {
            throw new RegraDeNegocioException("Um animal adotado nao pode ser suspenso.");
        }
        this.status = StatusAnimal.INDISPONIVEL;
        marcarAlteracao();
    }

    /**
     * Adocao concluida e historico, e historico nao se apaga. Nesse caso o
     * caminho e a devolucao, que deixa registro, e nao a exclusao.
     */
    public void exigirQuePodeSerExcluido() {
        if (status == StatusAnimal.ADOTADO) {
            throw new RegraDeNegocioException(
                    "Animal adotado nao pode ser excluido, porque o registro da adocao se perderia. "
                            + "Se ele voltou, registre a devolucao.");
        }
    }

    private void marcarAlteracao() {
        this.atualizadoEm = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Abrigo getAbrigo() {
        return abrigo;
    }

    public String getNome() {
        return nome;
    }

    public Especie getEspecie() {
        return especie;
    }

    public String getRaca() {
        return raca;
    }

    public Sexo getSexo() {
        return sexo;
    }

    public Porte getPorte() {
        return porte;
    }

    public LocalDate getNascimentoEstimado() {
        return nascimentoEstimado;
    }

    public int getPesoEmGramas() {
        return pesoEmGramas;
    }

    public boolean isCastrado() {
        return castrado;
    }

    public boolean isVacinado() {
        return vacinado;
    }

    public boolean isVermifugado() {
        return vermifugado;
    }

    public String getHistoria() {
        return historia;
    }

    public String getObservacoesDeSaude() {
        return observacoesDeSaude;
    }

    public StatusAnimal getStatus() {
        return status;
    }

    public LocalDate getDataDeEntrada() {
        return dataDeEntrada;
    }

    public Set<Temperamento> getTemperamentos() {
        return temperamentos.isEmpty() ? EnumSet.noneOf(Temperamento.class) : EnumSet.copyOf(temperamentos);
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public Instant getAtualizadoEm() {
        return atualizadoEm;
    }
}
