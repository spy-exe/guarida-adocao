package br.com.ricardofigueiredo.guarida.candidatura;

import br.com.ricardofigueiredo.guarida.animal.Animal;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
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
import java.util.EnumSet;
import java.util.Set;

/**
 * O pedido de quem quer adotar. Chega pelo catalogo publico, sem cadastro, e a
 * partir dai vira trabalho do abrigo: analisar, aprovar ou recusar.
 */
@Entity
@Table(name = "candidatura")
public class Candidatura {

    private static final Set<StatusDaCandidatura> EM_ABERTO =
            EnumSet.of(StatusDaCandidatura.RECEBIDA, StatusDaCandidatura.EM_ANALISE);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 160)
    private String email;

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(nullable = false, length = 80)
    private String cidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDeMoradia moradia;

    @Column(name = "area_protegida", nullable = false)
    private boolean areaProtegida;

    @Column(name = "tem_outros_animais", nullable = false)
    private boolean temOutrosAnimais;

    @Column(length = 800)
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusDaCandidatura status;

    @Column(name = "motivo_da_recusa", length = 300)
    private String motivoDaRecusa;

    @Column(name = "criada_em", nullable = false)
    private Instant criadaEm;

    @Column(name = "atualizada_em", nullable = false)
    private Instant atualizadaEm;

    protected Candidatura() {
    }

    public Candidatura(Animal animal, String nome, String email, String telefone, String cidade,
                       TipoDeMoradia moradia, boolean areaProtegida, boolean temOutrosAnimais,
                       String mensagem) {
        this.animal = animal;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.cidade = cidade;
        this.moradia = moradia;
        this.areaProtegida = areaProtegida;
        this.temOutrosAnimais = temOutrosAnimais;
        this.mensagem = mensagem;
        this.status = StatusDaCandidatura.RECEBIDA;
        this.criadaEm = Instant.now();
        this.atualizadaEm = this.criadaEm;
    }

    public void colocarEmAnalise() {
        exigirEmAberto("colocar em analise");
        this.status = StatusDaCandidatura.EM_ANALISE;
        marcarAlteracao();
    }

    public void aprovar() {
        exigirEmAberto("aprovar");
        this.status = StatusDaCandidatura.APROVADA;
        this.motivoDaRecusa = null;
        marcarAlteracao();
    }

    public void recusar(String motivo) {
        exigirEmAberto("recusar");
        if (motivo == null || motivo.isBlank()) {
            throw new RegraDeNegocioException(
                    "Recusa sem motivo nao ajuda ninguem. Escreva o que faltou.");
        }
        this.status = StatusDaCandidatura.RECUSADA;
        this.motivoDaRecusa = motivo.trim();
        marcarAlteracao();
    }

    /** Usada quando outra candidatura para o mesmo animal e aprovada. */
    public void cancelar() {
        if (!EM_ABERTO.contains(status)) {
            return;
        }
        this.status = StatusDaCandidatura.CANCELADA;
        marcarAlteracao();
    }

    public boolean estaEmAberto() {
        return EM_ABERTO.contains(status);
    }

    private void exigirEmAberto(String acao) {
        if (!EM_ABERTO.contains(status)) {
            throw new RegraDeNegocioException("So da para " + acao
                    + " uma candidatura em aberto. Situacao atual: " + status.getRotulo() + ".");
        }
    }

    private void marcarAlteracao() {
        this.atualizadaEm = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Animal getAnimal() {
        return animal;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getCidade() {
        return cidade;
    }

    public TipoDeMoradia getMoradia() {
        return moradia;
    }

    public boolean isAreaProtegida() {
        return areaProtegida;
    }

    public boolean isTemOutrosAnimais() {
        return temOutrosAnimais;
    }

    public String getMensagem() {
        return mensagem;
    }

    public StatusDaCandidatura getStatus() {
        return status;
    }

    public String getMotivoDaRecusa() {
        return motivoDaRecusa;
    }

    public Instant getCriadaEm() {
        return criadaEm;
    }

    public Instant getAtualizadaEm() {
        return atualizadaEm;
    }
}
