# Gerador Procedural de Áudio 8-Bit (`generate-8bit-sfx.py`)

Este documento descreve o funcionamento e o fluxo de uso do utilitário em Python responsável por sintetizar efeitos sonoros (SFX) retrô / 8-bit proceduralmente dentro do repositório, sem necessidade de APIs externas pagas.

---

## Localização e Objetivo

- **Script**: `ic_game/scripts/generate-8bit-sfx.py`
- **Pasta de Saída**: `ic_game/src/assets/audio/*.mp3`
- **Atalho NPM**: `npm run sfx:generate` (executado dentro de `ic_game/`)

O script utiliza **NumPy** para síntese matemática de ondas sonoras (44.1 kHz, quantização de amplitude estilo DAC 8-bit) e **lameenc** para codificar diretamente os arquivos `.mp3` finais na pasta de assets de áudio do front-end.

---

## Pré-requisitos do Ambiente

Certifique-se de ter o **Python 3** instalado com os pacotes `numpy` e `lameenc`:

```bash
python -m pip install numpy lameenc
```

Para regerar todos os efeitos sonoros registrados no script:

```bash
cd ic_game
npm run sfx:generate
```

---

## Primitivas de Síntese Disponíveis no Script

O arquivo `ic_game/scripts/generate-8bit-sfx.py` fornece blocos de construção (DSP) reutilizáveis para criar novos sons:

1. **`square_wave(freq_start, freq_end, duration_s, duty=0.5, vibrato_hz=0.0, vibrato_depth_hz=0.0)`**
   - Gera ondas quadradas/pulso típicas de consoles 8-bit com suporte a _pitch slide_ (glissando) e vibrato/trinado por LFO.
2. **`triangle_square_hybrid_chirp(freq_points, duration_s, square_mix=0.28)`**
   - Gera uma onda triangular quantizada em 16 níveis (estilo canal triangular do NES) combinada com harmônicos de pulso de 25%, ideal para guinchos curtos (`rat_squeaks`), apitos ou alertas.
3. **`bandpass_filtered_noise(duration_s, low_hz, high_hz, rng, hold_factor)`**
   - Gera ruído branco com redução de taxa de amostragem (_sample-and-hold_) e filtro passa-faixa via FFT, ideal para efeitos de _foley_ secos como passos (`rat_steps`), cliques ou percussão retrô.
4. **`apply_envelope(signal, attack_s, decay_s, sustain_level, release_s, exp_decay)`**
   - Aplica envelope ADSR e decaimento exponencial para evitar estalos (_clicks_) no início ou fim do som.
5. **`quantize_8bit(signal, levels)` e `mix_at(target, clip, offset_s)`**
   - Quantiza a resolução dinâmica e mistura múltiplos eventos sonoros em uma linha do tempo (`target`).

---

## Sons Atualmente Gerados

| Chave / Arquivo (`src/assets/audio/`) | Descrição |
| :--- | :--- |
| `rat_steps.mp3` | Passos curtos e secos de rato caminhando/correndo (pulsos de 12–15ms de ruído filtrado entre 3000Hz e 4000Hz). |
| `rat_squeaks.mp3` | 3 guinchos agudos e ultracurtos (55–72ms) deslizando entre 2800Hz e 4200Hz. |

> [!NOTE]
> O efeito `morning_cock` está registrado no `AudioManager.js` e em `src/data/dialogues/effects.js` para uso na transição de manhã do Modo História, reservado para um arquivo `morning_cock.mp3` dedicado.

---

## Como Adicionar um Novo Som 8-Bit

1. Abra `ic_game/scripts/generate-8bit-sfx.py`.
2. Crie uma função `synth_<nome_do_som>() -> np.ndarray` que retorne um array `float32` mono no intervalo `[-1.0, 1.0]`.
3. Registre a função no dicionário `SOUND_REGISTRY` no final do arquivo:
   ```python
   SOUND_REGISTRY: Dict[str, Callable[[], np.ndarray]] = {
       "rat_steps": synth_rat_steps,
       "rat_squeaks": synth_rat_squeaks,
       "meu_novo_som": synth_meu_novo_som,
   }
   ```
4. Execute `npm run sfx:generate` dentro de `ic_game/` para gerar `src/assets/audio/meu_novo_som.mp3`.
5. Se for um som de UI ou efeito de diálogo (tocado via Web Audio API sem atraso), adicione `"meu_novo_som"` ao array `UI_SOUND_KEYS` em `ic_game/src/game/managers/AudioManager.js`.
