package br.com.ricardofigueiredo.guarida.abrigo;

import br.com.ricardofigueiredo.guarida.abrigo.dto.AbrigoResponse;
import br.com.ricardofigueiredo.guarida.abrigo.dto.LoginRequest;
import br.com.ricardofigueiredo.guarida.abrigo.dto.RegistroRequest;
import br.com.ricardofigueiredo.guarida.abrigo.dto.TokenResponse;
import br.com.ricardofigueiredo.guarida.seguranca.AbrigoAutenticado;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/autenticacao")
@Tag(name = "Autenticação", description = "Cadastro do abrigo e emissão de token")
public class AutenticacaoController {

    private final AutenticacaoService autenticacaoService;

    public AutenticacaoController(AutenticacaoService autenticacaoService) {
        this.autenticacaoService = autenticacaoService;
    }

    @PostMapping("/registro")
    @Operation(summary = "Cadastra um abrigo")
    public ResponseEntity<AbrigoResponse> registrar(@Valid @RequestBody RegistroRequest requisicao) {
        Abrigo abrigo = autenticacaoService.registrar(requisicao);
        return ResponseEntity.status(HttpStatus.CREATED).body(AbrigoResponse.de(abrigo));
    }

    @PostMapping("/login")
    @Operation(summary = "Troca e-mail e senha por um token")
    public TokenResponse entrar(@Valid @RequestBody LoginRequest requisicao) {
        return autenticacaoService.autenticar(requisicao);
    }

    @GetMapping("/eu")
    @Operation(summary = "Devolve os dados do abrigo dono do token")
    public AbrigoResponse eu(@AuthenticationPrincipal AbrigoAutenticado autenticado) {
        return AbrigoResponse.de(autenticado.getAbrigo());
    }
}
