package br.com.ricardofigueiredo.guarida.painel;

import br.com.ricardofigueiredo.guarida.animal.AnimalService;
import br.com.ricardofigueiredo.guarida.animal.AnimalSpecs;
import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.animal.Porte;
import br.com.ricardofigueiredo.guarida.animal.Sexo;
import br.com.ricardofigueiredo.guarida.animal.StatusAnimal;
import br.com.ricardofigueiredo.guarida.animal.Temperamento;
import br.com.ricardofigueiredo.guarida.animal.dto.AnimalResponse;
import br.com.ricardofigueiredo.guarida.comum.PaginaResponse;
import br.com.ricardofigueiredo.guarida.painel.dto.AdocoesNoMes;
import br.com.ricardofigueiredo.guarida.painel.dto.FatiaDeEspecie;
import br.com.ricardofigueiredo.guarida.painel.dto.ResumoDoAbrigo;
import br.com.ricardofigueiredo.guarida.seguranca.AbrigoAutenticado;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * O que o abrigo ve quando entra. Diferente do catalogo publico, aqui aparecem
 * tambem os animais que sairam da vitrine.
 */
@RestController
@RequestMapping("/api/v1/painel")
@Tag(name = "Painel", description = "Visao do abrigo sobre o proprio acervo")
public class PainelController {

    private final AnimalService animalService;
    private final PainelService painelService;

    public PainelController(AnimalService animalService, PainelService painelService) {
        this.animalService = animalService;
        this.painelService = painelService;
    }

    @GetMapping("/animais")
    @Operation(summary = "Lista os animais do abrigo, inclusive os que nao estao na vitrine")
    public PaginaResponse<AnimalResponse> animais(
            @AuthenticationPrincipal AbrigoAutenticado autenticado,
            @RequestParam(required = false) Especie especie,
            @RequestParam(required = false) Porte porte,
            @RequestParam(required = false) Sexo sexo,
            @RequestParam(required = false) StatusAnimal status,
            @RequestParam(required = false) Temperamento temperamento,
            @RequestParam(required = false) String busca,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC)
            Pageable paginacao) {

        var filtro = new AnimalSpecs.Filtro(especie, porte, sexo, status, temperamento, null, null, busca);
        return PaginaResponse.de(
                animalService.listarDoAbrigo(autenticado.getAbrigo(), filtro, paginacao),
                AnimalResponse::de);
    }

    @GetMapping("/resumo")
    @Operation(summary = "Contagem por situacao, fila de candidaturas e tempo medio ate a adocao")
    public ResumoDoAbrigo resumo(@AuthenticationPrincipal AbrigoAutenticado autenticado) {
        return painelService.resumir(autenticado.getAbrigo());
    }

    @GetMapping("/especies")
    @Operation(summary = "Quantos animais de cada especie o abrigo mantem")
    public List<FatiaDeEspecie> especies(@AuthenticationPrincipal AbrigoAutenticado autenticado) {
        return painelService.porEspecie(autenticado.getAbrigo());
    }

    @GetMapping("/adocoes-por-mes")
    @Operation(summary = "Quantas adocoes foram concluidas a cada mes")
    public List<AdocoesNoMes> adocoesPorMes(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                            @RequestParam(defaultValue = "12") int meses) {
        return painelService.adocoesPorMes(autenticado.getAbrigo(), meses);
    }
}
