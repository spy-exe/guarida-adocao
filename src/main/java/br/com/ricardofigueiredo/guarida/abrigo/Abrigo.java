package br.com.ricardofigueiredo.guarida.abrigo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Quem mantem os cadastros: abrigo, ONG ou protetor independente. Todo animal
 * pertence a um, e so ele altera ou exclui o que cadastrou.
 */
@Entity
@Table(name = "abrigo")
public class Abrigo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Column(nullable = false)
    private String cidade;

    private String telefone;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    protected Abrigo() {
    }

    public Abrigo(String nome, String email, String senhaHash, String cidade, String telefone) {
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.cidade = cidade;
        this.telefone = telefone;
        this.criadoEm = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public String getCidade() {
        return cidade;
    }

    public String getTelefone() {
        return telefone;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }
}
