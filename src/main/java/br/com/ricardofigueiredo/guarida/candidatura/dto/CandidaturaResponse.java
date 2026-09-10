package br.com.ricardofigueiredo.guarida.candidatura.dto;

import br.com.ricardofigueiredo.guarida.candidatura.Candidatura;
import br.com.ricardofigueiredo.guarida.candidatura.StatusDaCandidatura;
import br.com.ricardofigueiredo.guarida.candidatura.TipoDeMoradia;

import java.time.Instant;

public record CandidaturaResponse(
        Long id,
        Long animalId,
        String animalNome,
        String nome,
        String email,
        String telefone,
        String cidade,
        TipoDeMoradia moradia,
        String moradiaRotulo,
        boolean areaProtegida,
        boolean temOutrosAnimais,
        String mensagem,
        StatusDaCandidatura status,
        String statusRotulo,
        String motivoDaRecusa,
        Instant criadaEm,
        Instant atualizadaEm) {

    public static CandidaturaResponse de(Candidatura candidatura) {
        return new CandidaturaResponse(
                candidatura.getId(),
                candidatura.getAnimal().getId(),
                candidatura.getAnimal().getNome(),
                candidatura.getNome(),
                candidatura.getEmail(),
                candidatura.getTelefone(),
                candidatura.getCidade(),
                candidatura.getMoradia(),
                candidatura.getMoradia().getRotulo(),
                candidatura.isAreaProtegida(),
                candidatura.isTemOutrosAnimais(),
                candidatura.getMensagem(),
                candidatura.getStatus(),
                candidatura.getStatus().getRotulo(),
                candidatura.getMotivoDaRecusa(),
                candidatura.getCriadaEm(),
                candidatura.getAtualizadaEm());
    }

    /**
     * Versao publica, devolvida a quem acabou de se candidatar: confirma o
     * recebimento sem repetir de volta os dados pessoais que a pessoa mandou.
     */
    public static CandidaturaResponse protocolo(Candidatura candidatura) {
        return new CandidaturaResponse(
                candidatura.getId(),
                candidatura.getAnimal().getId(),
                candidatura.getAnimal().getNome(),
                candidatura.getNome(),
                null, null, null, null, null, false, false, null,
                candidatura.getStatus(),
                candidatura.getStatus().getRotulo(),
                null,
                candidatura.getCriadaEm(),
                candidatura.getAtualizadaEm());
    }
}
