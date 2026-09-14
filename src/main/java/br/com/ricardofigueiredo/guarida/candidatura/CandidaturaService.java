package br.com.ricardofigueiredo.guarida.candidatura;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.Animal;
import br.com.ricardofigueiredo.guarida.animal.AnimalService;
import br.com.ricardofigueiredo.guarida.animal.StatusAnimal;
import br.com.ricardofigueiredo.guarida.animal.TipoDeEvento;
import br.com.ricardofigueiredo.guarida.candidatura.dto.CandidatarRequest;
import br.com.ricardofigueiredo.guarida.comum.excecao.RecursoNaoEncontradoException;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class CandidaturaService {

    private static final Logger log = LoggerFactory.getLogger(CandidaturaService.class);

    /** Fila aberta grande demais e sinal de que o abrigo nao esta dando conta. */
    private static final long LIMITE_DE_CANDIDATURAS_EM_ABERTO = 20;

    private final CandidaturaRepository candidaturaRepository;
    private final AnimalService animalService;

    public CandidaturaService(CandidaturaRepository candidaturaRepository, AnimalService animalService) {
        this.candidaturaRepository = candidaturaRepository;
        this.animalService = animalService;
    }

    @Transactional
    public Candidatura candidatar(Long animalId, CandidatarRequest requisicao) {
        Animal animal = animalService.buscar(animalId);

        if (animal.getStatus() != StatusAnimal.DISPONIVEL) {
            throw new RegraDeNegocioException(animal.getNome()
                    + " não esta disponível para adoção no momento. Situação atual: "
                    + animal.getStatus().getRotulo() + ".");
        }

        long emAberto = candidaturaRepository.countByAnimalAndStatusIn(animal,
                List.of(StatusDaCandidatura.RECEBIDA, StatusDaCandidatura.EM_ANALISE));

        if (emAberto >= LIMITE_DE_CANDIDATURAS_EM_ABERTO) {
            throw new RegraDeNegocioException(
                    "A fila de interessados neste animal esta cheia. Tente de novo em alguns dias.");
        }

        Candidatura candidatura = candidaturaRepository.save(new Candidatura(
                animal,
                requisicao.nome().trim(),
                requisicao.email().trim().toLowerCase(java.util.Locale.ROOT),
                requisicao.telefone().trim(),
                requisicao.cidade().trim(),
                requisicao.moradia(),
                requisicao.areaProtegida(),
                requisicao.temOutrosAnimais(),
                requisicao.mensagem() == null || requisicao.mensagem().isBlank()
                        ? null : requisicao.mensagem().trim()));

        log.info("candidatura {} recebida para o animal {}", candidatura.getId(), animalId);
        return candidatura;
    }

    @Transactional(readOnly = true)
    public Page<Candidatura> listar(Abrigo abrigo, StatusDaCandidatura status, Pageable paginacao) {
        return candidaturaRepository.doAbrigo(abrigo, status, paginacao);
    }

    @Transactional(readOnly = true)
    public List<Candidatura> doAnimal(Abrigo abrigo, Long animalId) {
        return candidaturaRepository.findByAnimalOrderByCriadaEmDesc(
                animalService.buscarDoAbrigo(abrigo, animalId));
    }

    @Transactional
    public Candidatura colocarEmAnalise(Abrigo abrigo, Long id) {
        Candidatura candidatura = buscar(abrigo, id);
        candidatura.colocarEmAnalise();
        return candidatura;
    }

    /**
     * Aprovar reserva o animal e cancela as outras candidaturas em aberto. Sem
     * isso duas pessoas continuariam esperando pelo mesmo bicho, e uma delas
     * levaria uma recusa que ninguem digitou.
     */
    @Transactional
    public Candidatura aprovar(Abrigo abrigo, Long id) {
        Candidatura candidatura = buscar(abrigo, id);
        Animal animal = candidatura.getAnimal();

        candidatura.aprovar();
        animal.reservar();

        candidaturaRepository.findByAnimalOrderByCriadaEmDesc(animal).stream()
                .filter(outra -> !outra.getId().equals(candidatura.getId()))
                .filter(Candidatura::estaEmAberto)
                .forEach(Candidatura::cancelar);

        animalService.registrarEvento(animal, TipoDeEvento.ATUALIZACAO,
                "Candidatura de " + candidatura.getNome() + " aprovada", LocalDate.now());

        log.info("candidatura {} aprovada, animal {} reservado", id, animal.getId());
        return candidatura;
    }

    @Transactional
    public Candidatura recusar(Abrigo abrigo, Long id, String motivo) {
        Candidatura candidatura = buscar(abrigo, id);
        candidatura.recusar(motivo);
        return candidatura;
    }

    /** A entrega aconteceu de verdade: o animal sai do abrigo e vira historia. */
    @Transactional
    public Candidatura concluirAdocao(Abrigo abrigo, Long id) {
        Candidatura candidatura = buscar(abrigo, id);

        if (candidatura.getStatus() != StatusDaCandidatura.APROVADA) {
            throw new RegraDeNegocioException(
                    "Só da para concluir a adoção a partir de uma candidatura aprovada. Situação atual: "
                            + candidatura.getStatus().getRotulo() + ".");
        }

        Animal animal = candidatura.getAnimal();
        animal.concluirAdocao();

        animalService.registrarEvento(animal, TipoDeEvento.ADOCAO,
                "Adotado por " + candidatura.getNome() + ", de " + candidatura.getCidade(),
                LocalDate.now());

        log.info("animal {} adotado por meio da candidatura {}", animal.getId(), id);
        return candidatura;
    }

    /** O animal voltou. Fica registrado e ele volta para a vitrine. */
    @Transactional
    public Animal registrarDevolucao(Abrigo abrigo, Long animalId, String motivo) {
        Animal animal = animalService.buscarDoAbrigo(abrigo, animalId);

        if (animal.getStatus() != StatusAnimal.ADOTADO) {
            throw new RegraDeNegocioException("Só um animal adotado pode ser devolvido.");
        }

        animal.devolverParaAdocao();
        animalService.registrarEvento(animal, TipoDeEvento.DEVOLUCAO,
                motivo == null || motivo.isBlank() ? "Devolvido ao abrigo" : motivo.trim(),
                LocalDate.now());

        return animal;
    }

    private Candidatura buscar(Abrigo abrigo, Long id) {
        return candidaturaRepository.doAbrigoPorId(id, abrigo)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Nenhuma candidatura encontrada com o id " + id + "."));
    }
}
