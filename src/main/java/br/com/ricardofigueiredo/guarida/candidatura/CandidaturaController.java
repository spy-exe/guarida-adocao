package br.com.ricardofigueiredo.guarida.candidatura;

import br.com.ricardofigueiredo.guarida.animal.dto.AnimalResponse;
import br.com.ricardofigueiredo.guarida.candidatura.dto.CandidatarRequest;
import br.com.ricardofigueiredo.guarida.candidatura.dto.CandidaturaResponse;
import br.com.ricardofigueiredo.guarida.candidatura.dto.RecusarRequest;
import br.com.ricardofigueiredo.guarida.comum.PaginaResponse;
import br.com.ricardofigueiredo.guarida.seguranca.AbrigoAutenticado;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Candidaturas", description = "Pedidos de adocao e o que o abrigo faz com eles")
public class CandidaturaController {

    private final CandidaturaService candidaturaService;

    public CandidaturaController(CandidaturaService candidaturaService) {
        this.candidaturaService = candidaturaService;
    }

    @PostMapping("/api/v1/animais/{id}/candidaturas")
    @Operation(summary = "Envia um pedido de adocao",
            description = """
                    Aberto ao publico, sem cadastro. A resposta e um protocolo: confirma o
                    recebimento sem devolver os dados pessoais que acabaram de ser enviados.""")
    public ResponseEntity<CandidaturaResponse> candidatar(
            @PathVariable Long id, @Valid @RequestBody CandidatarRequest requisicao) {

        Candidatura candidatura = candidaturaService.candidatar(id, requisicao);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CandidaturaResponse.protocolo(candidatura));
    }

    @GetMapping("/api/v1/candidaturas")
    @Operation(summary = "Lista as candidaturas recebidas pelo abrigo")
    public PaginaResponse<CandidaturaResponse> listar(
            @AuthenticationPrincipal AbrigoAutenticado autenticado,
            @RequestParam(required = false) StatusDaCandidatura status,
            @PageableDefault(size = 20) Pageable paginacao) {

        return PaginaResponse.de(
                candidaturaService.listar(autenticado.getAbrigo(), status, paginacao),
                CandidaturaResponse::de);
    }

    @GetMapping("/api/v1/animais/{id}/candidaturas")
    @Operation(summary = "Lista as candidaturas de um animal")
    public List<CandidaturaResponse> doAnimal(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                              @PathVariable Long id) {
        return candidaturaService.doAnimal(autenticado.getAbrigo(), id).stream()
                .map(CandidaturaResponse::de)
                .toList();
    }

    @PostMapping("/api/v1/candidaturas/{id}/analise")
    @Operation(summary = "Marca a candidatura como em analise")
    public CandidaturaResponse analisar(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                        @PathVariable Long id) {
        return CandidaturaResponse.de(candidaturaService.colocarEmAnalise(autenticado.getAbrigo(), id));
    }

    @PostMapping("/api/v1/candidaturas/{id}/aprovacao")
    @Operation(summary = "Aprova a candidatura",
            description = "Reserva o animal e cancela as outras candidaturas em aberto para ele.")
    public CandidaturaResponse aprovar(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                       @PathVariable Long id) {
        return CandidaturaResponse.de(candidaturaService.aprovar(autenticado.getAbrigo(), id));
    }

    @PostMapping("/api/v1/candidaturas/{id}/recusa")
    @Operation(summary = "Recusa a candidatura, com motivo")
    public CandidaturaResponse recusar(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                       @PathVariable Long id,
                                       @Valid @RequestBody RecusarRequest requisicao) {
        return CandidaturaResponse.de(
                candidaturaService.recusar(autenticado.getAbrigo(), id, requisicao.motivo()));
    }

    @PostMapping("/api/v1/candidaturas/{id}/adocao")
    @Operation(summary = "Conclui a adocao",
            description = "So a partir de uma candidatura aprovada. O animal passa a constar como adotado.")
    public CandidaturaResponse concluir(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                        @PathVariable Long id) {
        return CandidaturaResponse.de(candidaturaService.concluirAdocao(autenticado.getAbrigo(), id));
    }

    @PostMapping("/api/v1/animais/{id}/devolucao")
    @Operation(summary = "Registra a devolucao de um animal adotado",
            description = "Fica na linha do tempo e o animal volta para a vitrine.")
    public AnimalResponse devolver(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                   @PathVariable Long id,
                                   @RequestParam(required = false) String motivo) {
        return AnimalResponse.de(
                candidaturaService.registrarDevolucao(autenticado.getAbrigo(), id, motivo));
    }
}
