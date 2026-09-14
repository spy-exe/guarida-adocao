package br.com.ricardofigueiredo.guarida.foto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A foto de um animal e o credito de quem a fez.
 *
 * O credito nao e enfeite: boa parte das fotos livres exige atribuicao, e
 * publicar sem o nome do autor e sem a licenca seria usar a imagem fora dos
 * termos. Por isso autor, licenca e fonte andam junto com os bytes.
 */
@Entity
@Table(name = "foto_do_animal")
public class FotoDoAnimal {

    @Id
    @Column(name = "animal_id")
    private Long animalId;

    @Column(nullable = false)
    private byte[] conteudo;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false)
    private int tamanho;

    /** Pedaco do hash do conteudo. Vai na URL e no ETag, e muda quando a foto muda. */
    @Column(nullable = false, length = 16)
    private String versao;

    @Column(length = 160)
    private String autor;

    @Column(length = 60)
    private String licenca;

    @Column(length = 300)
    private String fonte;

    @Column(name = "atualizada_em", nullable = false)
    private Instant atualizadaEm;

    protected FotoDoAnimal() {
    }

    public FotoDoAnimal(Long animalId) {
        this.animalId = animalId;
    }

    public void trocar(byte[] conteudo, TipoDeImagem tipo, String versao, String autor, String licenca,
                       String fonte) {
        this.conteudo = conteudo;
        this.tipo = tipo.mime();
        this.tamanho = conteudo.length;
        this.versao = versao;
        this.autor = autor;
        this.licenca = licenca;
        this.fonte = fonte;
        this.atualizadaEm = Instant.now();
    }

    public Long getAnimalId() {
        return animalId;
    }

    public byte[] getConteudo() {
        return conteudo;
    }

    public String getTipo() {
        return tipo;
    }

    public int getTamanho() {
        return tamanho;
    }

    public String getVersao() {
        return versao;
    }

    public String getAutor() {
        return autor;
    }

    public String getLicenca() {
        return licenca;
    }

    public String getFonte() {
        return fonte;
    }

    public Instant getAtualizadaEm() {
        return atualizadaEm;
    }
}
