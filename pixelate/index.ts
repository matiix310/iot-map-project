import { parseArgs } from "util";
import path from "path";
import { $ } from "bun";

type Int16 = number & { __brand: "int16" };

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    resolution: {
      short: "s",
      type: "string",
    },
    framerate: {
      short: "f",
      type: "string",
    },
    output: {
      short: "o",
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

const pixelatev2 = async () => {
  let width, height;
  const input = positionals[positionals.length - 1];

  if (values.resolution) {
    width = parseInt(values.resolution.split("x")[0]);
    height = parseInt(values.resolution.split("x")[1]);
  } else {
    const size = (
      await $`ffprobe -v error -show_entries stream=width,height -of default=noprint_wrappers=1 ${input}`
    )
      .text()
      .split("\n");
    width = parseInt(size[0].split("=")[1]);
    height = parseInt(size[1].split("=")[1]);
  }

  const framerate = parseInt(values.framerate ?? "1");

  const totalFrame =
    (parseInt(
      (
        await $`ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 ${input}`
      ).text()
    ) /
      30) *
    framerate;

  const pixelCount = width * height;

  const proc = Bun.spawn([
    "ffmpeg",
    "-i",
    input,
    "-r",
    values.framerate ?? "1",
    "-vf",
    "format=gray",
    "-f",
    "image2pipe",
    "-c:v",
    "ppm",
    "-s",
    `${width}x${height}`,
    "-hide_banner",
    "-loglevel",
    "error",
    "-",
  ]);

  const stream = proc.stdout;

  const headerSize = 9 + width.toString().length + height.toString().length;

  let frame = new Uint16Array(pixelCount);
  let pixelIndexInFrame = 0;
  let frameIndex = 0;
  let pixelIndex = 0;
  let lost = 0;
  let chunkIndex = 0;
  let lastOffset = 0;

  for await (const chunk of stream) {
    let bufferIndex = lastOffset;

    while (bufferIndex < chunk.length) {
      if (chunk[bufferIndex] == 80 && chunk[bufferIndex + 1] == 54) {
        bufferIndex += headerSize;
        if (pixelIndex != 0) lost++;
        pixelIndex = 0;
        pixelIndexInFrame = 0;
      }
      while (pixelIndex < pixelCount && bufferIndex < chunk.length) {
        if (chunk[bufferIndex] < 100) {
          const x = pixelIndex % width;
          const y = height - Math.floor(pixelIndex / width);

          frame[pixelIndexInFrame++] = (x * 7) as Int16;
          frame[pixelIndexInFrame++] = (y * 7) as Int16;
        }
        pixelIndex++;
        bufferIndex += 3;
      }

      if (pixelIndex == pixelCount) {
        const buffer = Buffer.allocUnsafe(pixelIndexInFrame * 2);

        for (let i = 0; i < pixelIndexInFrame; i++) {
          buffer[i * 2] = frame[i] >> 8;
          buffer[i * 2 + 1] = frame[i] & 0xff;
        }

        Bun.write(
          Bun.file(
            path.join(
              values.output!,
              "frame_" +
                "0".repeat(6 - frameIndex.toString().length) +
                frameIndex +
                ".pixelate"
            )
          ),
          buffer
        );
        console.log(
          "\x1b[A\x1b[K" + Math.floor((frameIndex / totalFrame) * 10000) / 100 + "%"
        );

        frameIndex++;
        pixelIndexInFrame = 0;
        pixelIndex = 0;
      }
    }
    lastOffset = bufferIndex - chunk.length;
    chunkIndex++;
  }
  console.log(
    "Frames lost:",
    lost,
    "(" + Math.floor((lost * 10000) / (frameIndex + lost)) / 100,
    "%)"
  );
  console.log("Frames created:", frameIndex);
};

const runScript = async () => {
  const start = Date.now();
  if (positionals.length == 2) {
    console.error("You must provide an input file!");
    return;
  }

  if (!values.output) {
    console.error("You must provied an output folder!");
    return;
  }

  const input = positionals[positionals.length - 1];
  const file = Bun.file(input);

  if (!(await file.exists())) {
    console.error(`The file "${input}" does not exist!`);
    return;
  }

  if (!file.type.startsWith("video")) {
    console.error(`Pixelate only supports video file!\nProvided: ${file.type}`);
    return;
  }

  await pixelatev2();

  console.log("Elapsed:", Date.now() - start, "ms");
};

runScript();
