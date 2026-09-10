package br.com.ricardofigueiredo.guarida.animal;

import br.com.ricardofigueiredo.guarida.animal.dto.AnimalResponse;
import br.com.ricardofigueiredo.guarida.animal.dto.AtualizarAnimalRequest;
import br.com.ricardofigueiredo.guarida.animal.dto.CadastrarAnimalRequest;
import br.com.ricardofigueiredo.guarida.animal.dto.EventoResponse;
import br.com.ricardofigueiredo.guarida.animal.dto.RegistrarEventoRequest;
import br.com.ricardofigueiredo.guarida.comum.PaginaResponse;
import br.com.ricardofigueiredo.guarida.seguranca.AbrigoAutenticado;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * As cinco operacoes do enunciado moram aqui: cadastrar, consultar todos,
 * consultar por id, alterar e excluir. Consultar e aberto, porque procurar um
 * animal para adotar nao pode exigir cadastro. O resto pede token do abrigo.
 */
@RestController
@RequestMapping("/api/v1/animais")
@Tag(name = "Animais", description = "Cadastro, consulta, alteracao e exclusao de animais")
public class AnimalController {

    private final AnimalService animalService;

    public AnimalController(AnimalService animalService) {
        this.animalService = animalService;
    }

    @PostMapping
    @Operation(summary = "Cadastra um animal",
            description = "Exige token do abrigo. A entrada no abrigo ja entra na linha do tempo.")
    public ResponseEntity<AnimalResponse> cadastrar(
            @AuthenticationPrincipal AbrigoAutenticado autenticado,
            @Valid @RequestBody CadastrarAnimalRequest requisicao) {

        Animal animal = animalService.cadastrar(autenticado.getAbrigo(), requisicao);
        return ResponseEntity
                .created(URI.create("/api/v1/animais/" + animal.getId()))
                .body(AnimalResponse.de(animal));
    }

    @GetMapping
    @Operation(summary = "Lista os animais do catalogo",
            description = """
                    Aberto ao publico. Aceita filtro por especie, porte, sexo, situacao,
                    temperamento, cidade do abrigo, apenas filhotes e busca livre por nome,
                    raca ou historia.""")
    public PaginaResponse<AnimalResponse> listar(
            @RequestParam(required = false) Especie especie,
            @RequestParam(required = false) Porte porte,
            @RequestParam(required = false) Sexo sexo,
            @RequestParam(required = false) StatusAnimal status,
            @RequestParam(required = false) Temperamento temperamento,
            @RequestParam(required = false) Boolean apenasFilhotes,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String busca,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC)
            Pageable paginacao) {

        var filtro = new AnimalSpecs.Filtro(especie, porte, sexo, status, temperamento,
                apenasFilhotes, cidade, busca);
        return PaginaResponse.de(animalService.listarCatalogo(filtro, paginacao), AnimalResponse::de);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta um animal pelo id", description = "Aberto ao publico.")
    public AnimalResponse buscar(@PathVariable Long id) {
        return AnimalResponse.de(animalService.buscar(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Altera um animal", description = "Exige token, e so o abrigo dono consegue.")
    public AnimalResponse atualizar(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                    @PathVariable Long id,
                                    @Valid @RequestBody AtualizarAnimalRequest requisicao) {
        return AnimalResponse.de(animalService.atualizar(autenticado.getAbrigo(), id, requisicao));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui um animal",
            description = """
                    Exige token, e so o abrigo dono consegue. Animal ja adotado nao pode ser
                    excluido, porque o registro da adocao se perderia junto: nesse caso o
                    caminho e registrar a devolucao.""")
    public ResponseEntity<Void> excluir(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                        @PathVariable Long id) {
        animalService.excluir(autenticado.getAbrigo(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/eventos")
    @Operation(summary = "Linha do tempo do animal", description = "Aberto ao publico.")
    public List<EventoResponse> eventos(@PathVariable Long id) {
        return animalService.eventos(id).stream().map(EventoResponse::de).toList();
    }

    @PostMapping("/{id}/eventos")
    @Operation(summary = "Registra um acontecimento na linha do tempo")
    public ResponseEntity<EventoResponse> registrarEvento(
            @AuthenticationPrincipal AbrigoAutenticado autenticado,
            @PathVariable Long id,
            @Valid @RequestBody RegistrarEventoRequest requisicao) {

        EventoDoAnimal evento = animalService.registrarEvento(autenticado.getAbrigo(), id, requisicao);
        return ResponseEntity.status(HttpStatus.CREATED).body(EventoResponse.de(evento));
    }

    @PostMapping("/{id}/suspensao")
    @Operation(summary = "Tira o animal da vitrine",
            description = "Para tratamento, quarentena ou qualquer motivo que peca pausa.")
    public AnimalResponse suspender(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                    @PathVariable Long id) {
        return AnimalResponse.de(animalService.suspender(autenticado.getAbrigo(), id));
    }

    @PostMapping("/{id}/reativacao")
    @Operation(summary = "Devolve o animal para a vitrine")
    public AnimalResponse reativar(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                   @PathVariable Long id) {
        return AnimalResponse.de(animalService.reativar(autenticado.getAbrigo(), id));
    }
}
