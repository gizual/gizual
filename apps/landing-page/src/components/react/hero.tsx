import ZoomIcon from "./icons/zoom.svg?react";
import PanIcon from "./icons/pan.svg?react";
import PinchIcon from "./icons/pinch.svg?react";

function HeroModule({
  heroImageSrc,
  canvasImageSrc,
  queryImageSrc,
  analyzeImageSrc,
}: {
  heroImageSrc: string;
  canvasImageSrc: string;
  queryImageSrc: string;
  analyzeImageSrc: string;
}) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          <div className="pb-8 text-center md:pb-12">
            <h1 className="mb-4 " data-aos="zoom-y-out">
              <span className="bg-gradient-to-b from-slate-200/60 to-slate-200 to-50% bg-clip-text text-transparent">
                {" "}
                {"Modernize your Git experience with"}
              </span>
              <br />
              <span className="inline-flex h-[calc(theme(fontSize.3xl)*theme(lineHeight.tight))] flex-col overflow-hidden text-transparent md:h-[calc(theme(fontSize.6xl)*theme(lineHeight.tight))]">
                <ul className="block animate-text-slide-4 text-center leading-tight [&_li]:block">
                  <li className="emGradient">visualizations</li>
                  <li className="emGradient">analytics</li>
                  <li className="emGradient">code statistics</li>
                  <li className="emGradient">contribution metrics</li>
                  <li className="emGradient" aria-hidden="true">
                    visualizations
                  </li>
                </ul>
              </span>
            </h1>
            <div className="mx-auto max-w-3xl">
              <div
                className="mb-8 mt-8 flex flex-col gap-0 text-lg font-normal text-slate-300 md:text-xl"
                data-aos="zoom-y-out"
                data-aos-delay="150"
              >
                <span>
                  Discover the future of codebase analysis. High-performance Git visualizations,
                  running <em className="emGradient">locally</em> - and right in your browser.
                </span>
              </div>
            </div>
          </div>

          <div
            className="relative mb-8 flex justify-center"
            data-aos="zoom-y-out"
            data-aos-delay="250"
          >
            <a
              className="flex cursor-pointer flex-col justify-center rounded-xl border border-border-primary"
              href="https://app.gizual.com"
            >
              <div className="group relative h-auto w-[350px] p-2 sm:w-[500px] md:w-[700px] lg:w-[768px]">
                <div className="absolute -inset-1 animate-bgAnimate rounded-xl bg-gradient-to-r from-blue-600 to-pink-600 bg-400% opacity-50 blur transition-all group-hover:opacity-80"></div>
                <img
                  className="relative z-10 mx-auto rounded border border-border-primary"
                  src={heroImageSrc}
                  width="768"
                  height="auto"
                  alt="Hero"
                />
              </div>
            </a>
          </div>

          <div
            className="relative flex flex-col items-center justify-center gap-2"
            data-aos="zoom-y-out"
            data-aos-delay="250"
          >
            <a
              className="w-48 rounded border border-border-primary bg-accent-main px-4 py-2 text-center font-semibold text-accent-main-fg transition-all hover:bg-accent-main-hover"
              href="https://app.gizual.com"
            >
              Try it now
            </a>
            <span className="text-center text-sm text-foreground-tertiary">
              Looking for even more performance? Download the native{" "}
              <a
                className="text-left font-normal text-foreground-link transition-all hover:underline"
                href="https://app.gizual.com"
              >
                Tauri build
              </a>
              .
            </span>
          </div>

          <div
            className="mx-auto mt-20 flex max-w-6xl justify-center lg:mt-32"
            data-aos="fade-right"
            data-aos-delay="250"
          >
            <div className="mb-8 mt-8 flex flex-col items-center gap-4 text-lg font-normal text-slate-300 md:text-xl">
              <h2 className="text-center">
                <em className="emGradient">Interactive</em> visualizations in multiple styles
              </h2>
              <span className="max-w-3xl text-center">
                Dive into an (almost) infinitely zoomable canvas showcasing your repository's files.
                Each line is color-coded based on a metric of your choosing, offering a unique
                historical perspective.
              </span>
              <div className="relative flex justify-center pt-8 md:pt-12">
                <div className="group relative h-auto w-[350px] rounded-xl border border-border-primary bg-gradient-to-r from-slate-800 to-slate-900 p-8 sm:w-[500px] md:w-[600px] lg:w-[768px]">
                  <ul className="flex w-full flex-col gap-6 md:w-[40%]">
                    <li className="flex flex-col items-start justify-start">
                      <ZoomIcon className="h-10 w-auto pb-2"></ZoomIcon>
                      <span className="text-xl font-bold">Zoom</span>
                      <span>
                        Zoom in to see individual lines of code or out to get a general overview.
                      </span>
                    </li>
                    <li className="flex flex-col items-start justify-start">
                      <PanIcon className="h-10 w-auto pb-2"></PanIcon>
                      <span className="text-xl font-bold">Pan</span>
                      <span>Drag the canvas to pan around a large set of files.</span>
                    </li>
                    <li className="flex flex-col items-start justify-start">
                      <PinchIcon className="h-10 w-auto pb-2"></PinchIcon>
                      <span className="text-xl font-bold">Pinch</span>
                      <span>
                        Pinch with two fingers on touch-devices, just like you're used to.
                      </span>
                    </li>
                  </ul>
                  <img
                    src={canvasImageSrc}
                    className="relative top-5 aspect-auto w-full rounded border-2 border-border-primary md:absolute md:right-[-10%] md:top-[15%] md:max-h-[70%] md:w-auto md:max-w-[60%]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="mx-auto mt-10 flex max-w-6xl justify-center lg:mt-20"
            data-aos="fade-left"
            data-aos-delay="250"
          >
            <div className="mb-8 mt-8 flex flex-col items-center gap-4 text-lg font-normal text-slate-300 md:text-xl">
              <h2 className="text-center">
                <em className="emGradient">Customizable</em> query language
              </h2>
              <span className="max-w-3xl text-center">
                Tailor your analytics with our built-in query language. Filter by authors, file
                changes, and more, for focused insights.
              </span>
              <span className="max-w-3xl text-center">
                Check the{" "}
                <a href="/docs" className="text-foreground-link hover:underline">
                  Documentation
                </a>{" "}
                for more details.
              </span>

              <div className="relative flex justify-center pt-8 md:pt-12">
                <div className="group relative h-auto w-[350px] p-2 sm:w-[500px] md:w-[700px] lg:w-[768px]">
                  <div className="absolute -inset-0 animate-bgAnimate rounded-xl bg-gradient-to-r from-blue-700 to-purple-600 bg-400% opacity-50 blur transition-all"></div>
                  <img
                    className="relative z-10 mx-auto rounded-xl border border-border-primary"
                    src={queryImageSrc}
                    width="768"
                    height="auto"
                    alt="Hero"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="mx-auto mt-10 flex max-w-6xl justify-center lg:mt-20"
            data-aos="fade-right"
            data-aos-delay="250"
          >
            <div className="mb-8 mt-8 flex flex-col items-center gap-4 text-lg font-normal text-slate-300 md:text-xl">
              <h2 className="text-center">
                <em className="emGradient">Glanceable</em> charts and statistics
              </h2>
              <span className="max-w-3xl text-center">
                Explore comprehensive charts in the Analyze section. See your repository's
                contribution history, file changes, and more.
              </span>

              <div className="relative flex justify-center pt-8 md:pt-12">
                <div className="group relative h-auto w-[350px] p-2 sm:w-[500px] md:w-[700px] lg:w-[768px]">
                  <div className="absolute -inset-0 animate-bgAnimate rounded-xl bg-gradient-to-r from-teal-600 to-blue-700 bg-400% opacity-50 blur transition-all"></div>
                  <img
                    className="relative z-10 mx-auto rounded-xl border border-border-primary"
                    src={analyzeImageSrc}
                    width="768"
                    height="auto"
                    alt="Hero"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="mx-auto mt-10 flex max-w-6xl justify-center lg:mt-20"
            data-aos="fade-down"
            data-aos-delay="250"
          >
            <div className="mb-8 mt-8 flex flex-col items-center gap-4 text-lg font-normal text-slate-300 md:text-xl">
              <h2 className="text-center">Ready to get started?</h2>
              <span className="max-w-3xl text-center">
                Gizual is free and open-source. Try it out now!
              </span>
              <a
                className="mt-8 w-48 rounded border border-border-primary bg-accent-main px-4 py-2 text-center font-semibold text-accent-main-fg transition-all hover:bg-accent-main-hover"
                href="https://app.gizual.com"
              >
                Let's go!
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { HeroModule };
