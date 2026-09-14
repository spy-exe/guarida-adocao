package br.com.ricardofigueiredo.guarida.animal;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.dto.AtualizarAnimalRequest;
import br.com.ricardofigueiredo.guarida.animal.dto.CadastrarAnimalRequest;
import br.com.ricardofigueiredo.guarida.animal.dto.RegistrarEventoRequest;
import br.com.ricardofigueiredo.guarida.candidatura.CandidaturaRepository;
import br.com.ricardofigueiredo.guarida.comum.excecao.RecursoNaoEncontradoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AnimalService {

    private static final Logger log = LoggerFactory.getLogger(AnimalService.class);

    private final AnimalRepository animalRepository;
    private final EventoDoAnimalRepository eventoRepository;
    private final CandidaturaRepository candidaturaRepository;

    public AnimalService(AnimalRepository animalRepository,
                         EventoDoAnimalRepository eventoRepository,
                         CandidaturaRepository candidaturaRepository) {
        this.animalRepository = animalRepository;
        this.eventoRepository = eventoRepository;
        this.candidaturaRepository = candidaturaRepository;
    }

    @Transactional
    public Animal cadastrar(Abrigo abrigo, CadastrarAnimalRequest requisicao) {
        Animal animal = new Animal(
                abrigo,
                requisicao.nome().trim(),
                requisicao.especie(),
                normalizar(requisicao.raca()),
                requisicao.sexo(),
                requisicao.porte(),
                requisicao.nascimentoEstimado(),
                requisicao.pesoEmGramas(),
                requisicao.dataDeEntrada());

        animal.editar(requisicao.nome().trim(), requisicao.especie(), normalizar(requisicao.raca()),
                requisicao.sexo(), requisicao.porte(), requisicao.nascimentoEstimado(),
                requisicao.pesoEmGramas(), normalizar(requisicao.historia()),
                normalizar(requisicao.observacoesDeSaude()), requisicao.castradoOuNao(),
                requisicao.vacinadoOuNao(), requisicao.vermifugadoOuNao(), requisicao.temperamentos());

        animalRepository.save(animal);
        registrarEvento(animal, TipoDeEvento.ENTRADA, "Entrada no abrigo", requisicao.dataDeEntrada());

        log.info("animal {} cadastrado pelo abrigo {}", animal.getId(), abrigo.getEmail());
        return animal;
    }

    @Transactional
    public Animal atualizar(Abrigo abrigo, Long id, AtualizarAnimalRequest requisicao) {
        Animal animal = buscarDoAbrigo(abrigo, id);

        animal.editar(requisicao.nome().trim(), requisicao.especie(), normalizar(requisicao.raca()),
                requisicao.sexo(), requisicao.porte(), requisicao.nascimentoEstimado(),
                requisicao.pesoEmGramas(), normalizar(requisicao.historia()),
                normalizar(requisicao.observacoesDeSaude()), requisicao.castradoOuNao(),
                requisicao.vacinadoOuNao(), requisicao.vermifugadoOuNao(), requisicao.temperamentos());

        registrarEvento(animal, TipoDeEvento.ATUALIZACAO, "Cadastro atualizado", LocalDate.now());
        return animal;
    }

    /**
     * A exclusao leva junto a linha do tempo e as candidaturas, porque nenhuma
     * das duas faz sentido sem o animal. Animal ja adotado nao passa por aqui:
     * a propria entidade recusa, para nao apagar o registro de uma adocao.
     */
    @Transactional
    public void excluir(Abrigo abrigo, Long id) {
        Animal animal = buscarDoAbrigo(abrigo, id);
        animal.exigirQuePodeSerExcluido();

        candidaturaRepository.deleteByAnimal(animal);
        eventoRepository.deleteByAnimal(animal);
        animalRepository.delete(animal);

        log.info("animal {} excluído pelo abrigo {}", id, abrigo.getEmail());
    }

    @Transactional(readOnly = true)
    public Animal buscar(Long id) {
        return animalRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Nenhum animal encontrado com o id " + id + "."));
    }

    @Transactional(readOnly = true)
    public Animal buscarDoAbrigo(Abrigo abrigo, Long id) {
        return animalRepository.findByIdAndAbrigo(id, abrigo)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Nenhum animal encontrado com o id " + id + "."));
    }

    @Transactional(readOnly = true)
    public Page<Animal> listarCatalogo(AnimalSpecs.Filtro filtro, Pageable paginacao) {
        return animalRepository.findAll(AnimalSpecs.doCatalogo(filtro), paginacao);
    }

    @Transactional(readOnly = true)
    public Page<Animal> listarDoAbrigo(Abrigo abrigo, AnimalSpecs.Filtro filtro, Pageable paginacao) {
        return animalRepository.findAll(AnimalSpecs.doAbrigo(abrigo, filtro), paginacao);
    }

    @Transactional(readOnly = true)
    public List<EventoDoAnimal> eventos(Long id) {
        return eventoRepository.findByAnimalOrderByAcontecidoAscIdAsc(buscar(id));
    }

    @Transactional
    public EventoDoAnimal registrarEvento(Abrigo abrigo, Long id, RegistrarEventoRequest requisicao) {
        Animal animal = buscarDoAbrigo(abrigo, id);
        return registrarEvento(animal, requisicao.tipo(), requisicao.descricao().trim(),
                requisicao.acontecido());
    }

    @Transactional
    public Animal suspender(Abrigo abrigo, Long id) {
        Animal animal = buscarDoAbrigo(abrigo, id);
        animal.suspender();
        registrarEvento(animal, TipoDeEvento.ATUALIZACAO, "Retirado da vitrine", LocalDate.now());
        return animal;
    }

    @Transactional
    public Animal reativar(Abrigo abrigo, Long id) {
        Animal animal = buscarDoAbrigo(abrigo, id);
        animal.devolverParaAdocao();
        registrarEvento(animal, TipoDeEvento.ATUALIZACAO, "De volta a vitrine", LocalDate.now());
        return animal;
    }

    /** Usada tambem pelo fluxo de candidatura, que precisa deixar marca na linha do tempo. */
    public EventoDoAnimal registrarEvento(Animal animal, TipoDeEvento tipo, String descricao,
                                          LocalDate quando) {
        return eventoRepository.save(new EventoDoAnimal(animal, tipo, descricao, quando));
    }

    private String normalizar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
