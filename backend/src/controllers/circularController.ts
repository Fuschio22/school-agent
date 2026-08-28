import { Request, Response } from "express";
import { analyzeCircularText } from "../services/aiService";
import { prisma } from "../lib/prisma";
import { filterEvents } from "../utils/classFilter";

// ============================================================
// FUNZIONE: ESTRAE MESE E ANNO DAL TESTO
// ============================================================

function extractMonthYear(
  text: string
): { month: string; year: string } | null {
  const months = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ];

  const lowerText = text.toLowerCase();

  for (const month of months) {
    if (lowerText.includes(month)) {
      const yearMatch = text.match(/\b(20\d{2})\b/);

      if (yearMatch) {
        return {
          month,
          year: yearMatch[1],
        };
      }
    }
  }

  return null;
}

// ============================================================
// FUNZIONE: VERIFICA SE È UNA RETTIFICA
// ============================================================

function isRettifica(text: string): boolean {
  const lowerText = text.toLowerCase();

  return (
    lowerText.includes("rettifica") ||
    lowerText.includes("modifica") ||
    lowerText.includes("variazione") ||
    lowerText.includes("aggiornamento") ||
    lowerText.includes("calendario definitivo") ||
    lowerText.includes("calendario aggiornato") ||
    lowerText.includes("nuovo calendario") ||
    lowerText.includes("calendarizzazione definitiva") ||
    lowerText.includes("integrazione") ||
    lowerText.includes("sostituisce") ||
    lowerText.includes("annulla e sostituisce")
  );
}

// ============================================================
// ANALIZZA E SALVA UNA CIRCOLARE
//
// Il PDF viene salvato direttamente nel database Neon
// tramite il campo Prisma fileData (Bytes).
//
// NON viene utilizzato il filesystem di Render.
// ============================================================

export const analyzeCircularController = async (
  req: Request,
  res: Response
) => {
  try {
    const { text, fileName } = req.body;

    const uploadedFile = req.file || null;

    if (!uploadedFile) {
      return res.status(400).json({
        error: "Il file PDF è obbligatorio",
      });
    }

    if (!text) {
      return res.status(400).json({
        error: "Il testo estratto è obbligatorio",
      });
    }

    // ============================================================
    // PDF IN MEMORIA
    // ============================================================

    // multer usa memoryStorage(), quindi il PDF è disponibile
    // direttamente come Buffer.
    const fileData = uploadedFile.buffer;

    console.log(
      "📄 File ricevuto:",
      uploadedFile.originalname
    );

    console.log(
      "📄 Dimensione PDF:",
      uploadedFile.size,
      "bytes"
    );

    console.log(
      "💾 PDF pronto per essere salvato nel database"
    );

    // ============================================================
    // 1. RECUPERA L'UTENTE
    // ============================================================

    let user = await prisma.user.findUnique({
      where: {
        email: "demo@schoolagent.it",
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "demo@schoolagent.it",
          name: "Utente Demo",
          classes: [
            "1AOR",
            "2AOR",
            "3AOR",
            "4AOR",
            "5AOR",
            "5BOR",
          ],
        },
      });
    }

    const userClasses = user.classes || [];

    console.log(
      "👤 Classi configurate dall'utente per il filtro AI:",
      userClasses
    );

    // ============================================================
    // 2. ANALISI AI
    // ============================================================

    const analysis = await analyzeCircularText(
      text,
      userClasses
    );

    console.log(
      "🤖 AI estrazione completata"
    );

    const circData =
      analysis.circolare || analysis;

    const eventsData = Array.isArray(
      analysis.eventi
    )
      ? analysis.eventi
      : Array.isArray(
          analysis.consigliDiClasse
        )
      ? analysis.consigliDiClasse
      : [];

    const orderOfDay = Array.isArray(
      analysis.ordineDelGiorno
    )
      ? analysis.ordineDelGiorno
      : [];

    // ============================================================
    // 3. FILTRO EVENTI
    // ============================================================

    const filteredEventsData = filterEvents(
      eventsData,
      userClasses
    );

    // ============================================================
    // 4. VALIDAZIONE ORARI
    // ============================================================

    const validatedEventsData =
      filteredEventsData.map(
        (event: any) => {
          if (
            event.oraInizio &&
            event.oraFine
          ) {
            const [
              hInizio,
              mInizio,
            ] = event.oraInizio
              .split(":")
              .map(Number);

            const [
              hFine,
              mFine,
            ] = event.oraFine
              .split(":")
              .map(Number);

            const minutiInizio =
              hInizio * 60 + mInizio;

            const minutiFine =
              hFine * 60 + mFine;

            if (
              minutiFine <=
              minutiInizio
            ) {
              const nuoviMinutiFine =
                minutiInizio + 45;

              const nuoveOre =
                Math.floor(
                  nuoviMinutiFine / 60
                );

              const nuoviMinuti =
                nuoviMinutiFine % 60;

              const nuovaOraFine =
                `${nuoveOre
                  .toString()
                  .padStart(
                    2,
                    "0"
                  )}:${nuoviMinuti
                  .toString()
                  .padStart(
                    2,
                    "0"
                  )}`;

              console.log(
                `⚠️ Corretto orario invertito per ${event.classe}: ${event.oraFine} → ${nuovaOraFine}`
              );

              return {
                ...event,
                oraFine:
                  nuovaOraFine,
              };
            }
          }

          return event;
        }
      );

    console.log(
      `🔍 Filtro applicato: da ${eventsData.length} eventi estratti dall'AI a ${validatedEventsData.length} eventi finali permessi.`
    );

    // ============================================================
    // 5. DATI CIRCOLARE
    // ============================================================

    const numeroCircolare = String(
      circData.numero || ""
    );

    const dataCircolare = String(
      circData.data || ""
    );

    const oggetto = String(
      circData.oggetto || ""
    );

    const rettifica =
      isRettifica(oggetto);

    console.log(
      `📝 È una rettifica? ${rettifica}`
    );

    let existingCircular: any =
      null;

    let eventsToDelete: string[] =
      [];

    let relevantCirculars: any[] =
      [];

    // ============================================================
    // 6. GESTIONE RETTIFICHE
    // ============================================================

    if (rettifica) {
      const monthYear =
        extractMonthYear(oggetto);

      if (monthYear) {
        console.log(
          `🔍 Cerco eventi da sostituire per: ${monthYear.month} ${monthYear.year}`
        );

        const similarCirculars =
          await prisma.circular.findMany({
            include: {
              events: true,
            },
            where: {
              OR: [
                {
                  subject: {
                    contains:
                      monthYear.month,
                    mode: "insensitive",
                  },
                },
                {
                  subject: {
                    contains:
                      "Consigli di Classe",
                    mode: "insensitive",
                  },
                },
                {
                  subject: {
                    contains:
                      "Scrutini",
                    mode: "insensitive",
                  },
                },
              ],
            },
          });

        relevantCirculars =
          similarCirculars.filter(
            (circ) => {
              const circMonthYear =
                extractMonthYear(
                  circ.subject
                );

              return (
                circMonthYear &&
                circMonthYear.month ===
                  monthYear.month &&
                circMonthYear.year ===
                  monthYear.year
              );
            }
          );

        if (
          relevantCirculars.length >
          0
        ) {
          console.log(
            `📋 Trovate ${relevantCirculars.length} circolari da sostituire`
          );

          for (const circ of relevantCirculars) {
            eventsToDelete =
              eventsToDelete.concat(
                circ.events.map(
                  (e: any) =>
                    e.id
                )
              );
          }

          existingCircular =
            relevantCirculars[
              relevantCirculars.length -
                1
            ];
        }
      }
    } else {
      existingCircular =
        await prisma.circular.findFirst({
          where: {
            number:
              numeroCircolare,
            date:
              dataCircolare,
          },
          include: {
            events: true,
          },
        });
    }

    // ============================================================
    // 7. CANCELLA EVENTI DELLE VECCHIE RETTIFICHE
    // ============================================================

    if (
      eventsToDelete.length > 0
    ) {
      console.log(
        `🗑️ Cancello ${eventsToDelete.length} eventi vecchi`
      );

      await prisma.event.deleteMany({
        where: {
          id: {
            in: eventsToDelete,
          },
        },
      });

      if (
        relevantCirculars.length >
        0
      ) {
        await prisma.circular.deleteMany({
          where: {
            id: {
              in: relevantCirculars.map(
                (c) => c.id
              ),
            },
          },
        });
      }
    }

    // ============================================================
    // 8. AGGIORNAMENTO CIRCOLARE ESISTENTE
    // ============================================================

    if (
      existingCircular &&
      !rettifica
    ) {
      await prisma.event.deleteMany({
        where: {
          circularId:
            existingCircular.id,
        },
      });

      const updatedCircular =
        await prisma.circular.update({
          where: {
            id: existingCircular.id,
          },

          data: {
            fileName:
              fileName ||
              uploadedFile.originalname ||
              existingCircular.fileName,

            // Manteniamo il campo per compatibilità,
            // ma NON viene utilizzato per recuperare il PDF.
            filePath:
              existingCircular.filePath,

            // ⭐ PDF NEL DATABASE
            fileData:
              fileData,

            subject:
              oggetto ||
              existingCircular.subject,

            summary:
              orderOfDay.length > 0
                ? orderOfDay.join(
                    "\n"
                  )
                : existingCircular.summary,

            text: text,

            events: {
              create:
                validatedEventsData.map(
                  (event: any) => ({
                    title:
                      event.title ||
                      `${
                        event.classe ||
                        "Classe"
                      } - ${
                        event.sede ||
                        "Sede"
                      }`,

                    type:
                      event.type ||
                      "Consigli di Classe",

                    date: String(
                      event.data ||
                        ""
                    ),

                    startTime:
                      String(
                        event.oraInizio ||
                          "15:00"
                      ),

                    endTime:
                      String(
                        event.oraFine ||
                          "16:00"
                      ),

                    location:
                      String(
                        event.sede ||
                          "Sede scolastica"
                      ),

                    circularNumber:
                      numeroCircolare,
                  })
                ),
            },
          },

          include: {
            events: true,
          },
        });

      console.log(
        "✅ Circolare AGGIORNATA con successo nel DB. ID:",
        updatedCircular.id
      );

      return res.json(
        updatedCircular
      );
    }

    // ============================================================
    // 9. CREAZIONE NUOVA CIRCOLARE
    // ============================================================

    const circular =
      await prisma.circular.create({
        data: {
          fileName:
            fileName ||
            uploadedFile.originalname ||
            "documento.pdf",

          // Manteniamo filePath nullo.
          // Il PDF viene conservato in fileData.
          filePath: null,

          // ⭐ PDF SALVATO DIRETTAMENTE IN NEON
          fileData: fileData,

          number:
            numeroCircolare,

          date:
            dataCircolare,

          subject:
            oggetto || "",

          summary:
            orderOfDay.length > 0
              ? orderOfDay.join(
                  "\n"
                )
              : "Nessun ordine del giorno",

          priority: "media",

          recipients:
            JSON.stringify(
              circData.destinatari ||
                []
            ),

          deadlines:
            JSON.stringify([]),

          text: text,

          userId: user.id,

          events: {
            create:
              validatedEventsData.map(
                (event: any) => ({
                  title:
                    event.title ||
                    `${
                      event.classe ||
                      "Classe"
                    } - ${
                      event.sede ||
                      "Sede"
                    }`,

                  type:
                    event.type ||
                    "Consigli di Classe",

                  date: String(
                    event.data ||
                      ""
                  ),

                  startTime:
                    String(
                      event.oraInizio ||
                        "15:00"
                    ),

                  endTime:
                    String(
                      event.oraFine ||
                        "16:00"
                    ),

                  location:
                    String(
                      event.sede ||
                        "Sede scolastica"
                    ),

                  circularNumber:
                    numeroCircolare,
                })
              ),
          },
        },

        include: {
          events: true,
        },
      });

    console.log(
      `✅ Circolare ${
        rettifica
          ? "RETTIFICA (sostituisce vecchie)"
          : "SALVATA"
      } con successo nel DB. ID:`,
      circular.id
    );

    return res.json(
      circular
    );
  } catch (error) {
    console.error(
      "❌ Errore analisi circolare:",
      error
    );

    return res.status(500).json({
      error:
        "Errore durante l'analisi AI della circolare",
    });
  }
};

// ============================================================
// RECUPERA TUTTE LE CIRCOLARI
// ============================================================

export const getAllCircularsController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const circulars =
        await prisma.circular.findMany({
          include: {
            events: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      return res.json(
        circulars
      );
    } catch (error) {
      console.error(
        "❌ Errore nel recupero delle circolari:",
        error
      );

      return res.status(500).json({
        error:
          "Errore nel recupero delle circolari",
      });
    }
  };

// ============================================================
// APRE IL PDF DIRETTAMENTE DAL DATABASE
// ============================================================
//
// IMPORTANTE:
// NON cerca più il file in /uploads.
// NON usa fs.existsSync().
// NON usa res.sendFile().
// Legge il Buffer direttamente da Neon tramite fileData.
// ============================================================

export const getCircularPDFController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } =
        req.params;

      const circular =
        await prisma.circular.findUnique(
          {
            where: {
              id,
            },

            select: {
              fileName: true,
              fileData: true,
            },
          }
        );

      if (!circular) {
        return res.status(404).json({
          error:
            "Circolare non trovata",
        });
      }

      if (!circular.fileData) {
        return res.status(404).json({
          error:
            "PDF non disponibile nel database",
        });
      }

      const safeFileName =
        (
          circular.fileName ||
          "documento.pdf"
        ).replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${safeFileName}"`
      );

      // ⭐ INVIA IL PDF DIRETTAMENTE DAL DATABASE
      return res.send(
        circular.fileData
      );
    } catch (error) {
      console.error(
        "❌ Errore nel recupero del PDF dal database:",
        error
      );

      return res.status(500).json({
        error:
          "Errore durante il recupero del PDF",
      });
    }
  };

// ============================================================
// ELIMINA CIRCOLARE
// ============================================================

export const deleteCircularController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } =
        req.params;

      const circular =
        await prisma.circular.findUnique(
          {
            where: {
              id,
            },

            include: {
              events: true,
            },
          }
        );

      if (!circular) {
        return res.status(404).json({
          error:
            "Circolare non trovata",
        });
      }

      await prisma.event.deleteMany({
        where: {
          circularId: id,
        },
      });

      await prisma.circular.delete({
        where: {
          id,
        },
      });

      console.log(
        `✅ Circolare eliminata con successo. ID: ${id}`
      );

      return res.json({
        message:
          "Circolare eliminata con successo",
      });
    } catch (error) {
      console.error(
        "❌ Errore nell'eliminazione della circolare:",
        error
      );

      return res.status(500).json({
        error:
          "Errore nell'eliminazione della circolare",
      });
    }
  };