package br.com.ricardofigueiredo.guarida.foto;

import br.com.ricardofigueiredo.guarida.foto.dto.FotoEnviadaResponse;
import br.com.ricardofigueiredo.guarida.seguranca.AbrigoAutenticado;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;

@RestController
@Tag(name = "Fotos", description = "Foto de cada animal, com o crédito de quem a fez")
public class FotoController {

    private final FotoService fotoService;

    public FotoController(FotoService fotoService) {
        this.fotoService = fotoService;
    }

    @PutMapping(value = "/api/v1/animais/{id}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Envia ou troca a foto do animal",
            description = """
                    Aceita JPEG, PNG ou WEBP de até 2 MB. O formato é conferido pelos primeiros bytes
                    do arquivo, e não pelo nome ou pelo tipo declarado. Autor, licença e fonte são
                    opcionais, mas obrigatórios na prática para foto que não é do próprio abrigo.""")
    public FotoEnviadaResponse enviar(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                      @PathVariable Long id,
                                      @RequestPart("arquivo") MultipartFile arquivo,
                                      @RequestParam(required = false) String autor,
                                      @RequestParam(required = false) String licenca,
                                      @RequestParam(required = false) String fonte) throws IOException {
        return FotoEnviadaResponse.de(
                fotoService.enviar(autenticado.getAbrigo(), id, arquivo.getBytes(), autor, licenca, fonte));
    }

    @GetMapping("/api/v1/animais/{id}/foto")
    @Operation(summary = "Devolve a foto do animal", description = "Aberto ao público, com cache e ETag.")
    public ResponseEntity<byte[]> baixar(@PathVariable Long id,
                                         @RequestHeader(name = "If-None-Match", required = false)
                                         String etagDoNavegador) {
        FotoDoAnimal foto = fotoService.buscar(id);
        String etag = "\"" + foto.getVersao() + "\"";

        // o navegador ja tem esta versao: responde vazio e economiza a banda da imagem
        if (etag.equals(etagDoNavegador)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.getTipo()))
                .contentLength(foto.getTamanho())
                .eTag(etag)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .body(foto.getConteudo());
    }

    @DeleteMapping("/api/v1/animais/{id}/foto")
    @Operation(summary = "Remove a foto do animal")
    public ResponseEntity<Void> remover(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                        @PathVariable Long id) {
        fotoService.remover(autenticado.getAbrigo(), id);
        return ResponseEntity.noContent().build();
    }
}
