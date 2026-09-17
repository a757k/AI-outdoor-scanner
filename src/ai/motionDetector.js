export class MotionDetector {
  constructor() {
    this.canvas = document.createElement(
      "canvas"
    );

    this.context =
      this.canvas.getContext(
        "2d",
        {
          willReadFrequently: true
        }
      );

    this.previousFrame = null;

    this.width = 160;
    this.height = 90;

    this.lastMotion = {
      detected: false,
      intensity: 0,
      regions: []
    };
  }

  analyze(video) {
    if (
      !video ||
      video.readyState < 2 ||
      video.videoWidth === 0
    ) {
      return this.lastMotion;
    }

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.context.drawImage(
      video,
      0,
      0,
      this.width,
      this.height
    );

    const current =
      this.context.getImageData(
        0,
        0,
        this.width,
        this.height
      );

    if (!this.previousFrame) {
      this.previousFrame = current;

      return this.lastMotion;
    }

    const previous =
      this.previousFrame;

    const gridWidth = 16;
    const gridHeight = 9;

    const cellWidth =
      this.width / gridWidth;

    const cellHeight =
      this.height / gridHeight;

    const regions = [];

    let totalDifference = 0;

    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        let difference = 0;
        let pixels = 0;

        const startX =
          Math.floor(gx * cellWidth);

        const endX =
          Math.min(
            this.width,
            Math.floor(
              (gx + 1) * cellWidth
            )
          );

        const startY =
          Math.floor(gy * cellHeight);

        const endY =
          Math.min(
            this.height,
            Math.floor(
              (gy + 1) * cellHeight
            )
          );

        for (
          let y = startY;
          y < endY;
          y++
        ) {
          for (
            let x = startX;
            x < endX;
            x++
          ) {
            const index =
              (y * this.width + x) * 4;

            const rDiff =
              Math.abs(
                current.data[index] -
                  previous.data[index]
              );

            const gDiff =
              Math.abs(
                current.data[index + 1] -
                  previous.data[index + 1]
              );

            const bDiff =
              Math.abs(
                current.data[index + 2] -
                  previous.data[index + 2]
              );

            difference +=
              (rDiff +
                gDiff +
                bDiff) /
              3;

            pixels++;
          }
        }

        const average =
          difference /
          Math.max(pixels, 1);

        totalDifference += average;

        if (average > 15) {
          regions.push({
            x: gx / gridWidth,
            y: gy / gridHeight,
            width:
              1 / gridWidth,
            height:
              1 / gridHeight,
            intensity:
              Math.min(
                1,
                average / 70
              )
          });
        }
      }
    }

    const averageSceneDifference =
      totalDifference /
      (gridWidth * gridHeight);

    this.previousFrame = current;

    this.lastMotion = {
      detected:
        averageSceneDifference > 4,

      intensity:
        Math.min(
          1,
          averageSceneDifference / 35
        ),

      regions
    };

    return this.lastMotion;
  }

  reset() {
    this.previousFrame = null;

    this.lastMotion = {
      detected: false,
      intensity: 0,
      regions: []
    };
  }
}
