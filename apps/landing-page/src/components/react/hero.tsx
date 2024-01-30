function HeroModule({ imageSrc }: { imageSrc: string }) {
  return (
    <section className="relative">
      {/* Illustration behind hero content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className="pb-8 text-center md:pb-12">
            <h1
              className="mb-4 text-3xl font-extrabold leading-tight tracking-tight md:text-6xl"
              data-aos="zoom-y-out"
            >
              <span className="bg-gradient-to-b from-slate-200/60 to-slate-200 to-50% bg-clip-text text-transparent">
                {" "}
                {"Modernize your Git experience with"}
              </span>
              <br />
              <span className="inline-flex h-[calc(theme(fontSize.3xl)*theme(lineHeight.normal))] flex-col overflow-hidden text-transparent md:h-[calc(theme(fontSize.6xl)*theme(lineHeight.normal))]">
                <ul className="block animate-text-slide-4 text-center leading-tight [&_li]:block">
                  <li className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                    visualizations
                  </li>
                  <li className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                    analytics
                  </li>
                  <li className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                    code statistics
                  </li>
                  <li className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
                    contribution metrics
                  </li>
                  <li
                    className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent"
                    aria-hidden="true"
                  >
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
                  Discover the future of codebase analysis with{" "}
                  <em className="font-extrabold not-italic text-blue-500">Gizual</em>.
                </span>
                <span>High-performance analytics, right in your browser.</span>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div
            className="relative mb-8 flex justify-center"
            data-aos="zoom-y-out"
            data-aos-delay="450"
          >
            <a
              className="flex cursor-pointer flex-col justify-center overflow-hidden rounded-xl border border-border-primary"
              href="https://app.gizual.com"
            >
              <div className="group relative h-auto w-[350px] p-2 sm:w-[500px] md:w-[700px] lg:w-[768px]">
                <div className="bg-400% animate-bgAnimate absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 to-pink-600 opacity-50 blur transition-all group-hover:opacity-80"></div>
                <img
                  className="relative z-10 mx-auto rounded border border-border-primary"
                  src={imageSrc}
                  width="768"
                  height="auto"
                  alt="Hero"
                />
              </div>
            </a>
          </div>

          <div className="relative flex justify-center" data-aos="zoom-y-out" data-aos-delay="650">
            <a
              className="hover:bg-accent-main-hover w-48 rounded border border-border-primary bg-accent-main px-4 py-2 font-normal text-accent-main-fg transition-all"
              href="https://app.gizual.com"
            >
              Try it now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export { HeroModule };
