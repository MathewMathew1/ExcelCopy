import { useState } from "react";
import { macroFieldSchemas } from "~/types/Macro";
import { IoArrowBack } from "react-icons/io5";
import Button from "../../Button";

const DocumentationPanel = ({ goBackFn }: { goBackFn: () => void }) => {
  const [openCommand, setOpenCommand] = useState<string | null>(null);

  const sections = [
    { id: "commands", label: "Commands" },
    { id: "extra", label: "Extra" },
  ];

  const scrollToSection = (id: string) => {
    const container = document.getElementById("scroll-container");
    const section = document.getElementById(id);

    if (section && container) {
      // Check if section is already in view
      const containerRect = container.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();

      // If the section is already visible within the container, don't scroll
      if (
        sectionRect.top >= containerRect.top &&
        sectionRect.bottom <= containerRect.bottom
      ) {
        return;
      }

      container.scrollTo({
        top: section.offsetTop - container.offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full rounded-md bg-white p-4 shadow-md">
      {/* Top Navigation */}
      <div className="mb-4 flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="rounded bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 hover:bg-blue-200"
          >
            {section.label}
          </button>
        ))}
        <Button onClick={() => goBackFn()}>
          <IoArrowBack />
        </Button>
      </div>

      <div id="scroll-container" className="h-full w-full overflow-auto pb-8">
        <div className="flex flex-col">
          <div id="commands" className="mb-10">
            <h2 className="mb-4 text-xl font-bold">Commands</h2>

            {Object.keys(macroFieldSchemas).map((command) => (
              <div key={command} className="mb-6">
                <button
                  onClick={() =>
                    setOpenCommand(openCommand === command ? null : command)
                  }
                  className="w-full rounded bg-gray-100 px-4 py-2 text-left font-bold text-green-600"
                >
                  {command}
                </button>

                {openCommand === command && (
                  <div className="mt-2 rounded bg-gray-50 p-3">
                    {Object.entries(
                      macroFieldSchemas[
                        command as keyof typeof macroFieldSchemas
                      ],
                    ).map(([param, config]) => (
                      <div key={param} className="mb-2 ml-4">
                        <strong>{param}</strong>: {config.type}
                        {config.required && (
                          <span className="ml-2 text-red-500">(required)</span>
                        )}
                        {config.flag && (
                          <span className="ml-2 text-gray-600">
                            Flag: {config.flag}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div id="extra" className="mt-10 pb-3">
            <h2 className="mb-4 text-xl font-bold">Extra</h2>
            <p className="text-gray-700">Placeholder.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPanel;
