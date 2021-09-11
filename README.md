# stadtbots-voice

The Stadtbots voice interface.

## Implemented Bots / Skills

### Seestadt.bot

Provides opening hours and public transport departure times for Aspern Seestadt under the name "[Seestadt.bot]".
Seestadt is located in the Vienna’s 22nd municipal district and one of Europe's larges urban development areas.
Users can ask the following questions:

* _Alexa, frag Seestadt.bot nach den Öffnungszeiten vom Leo._
* _Alexa, frag Seestadt.bot wann der nächste Bus kommt._
* _Alexa, frag Seestadt.bot wann die U2 fährt._
* _Alexa, frag Seestadt.bot wann der nächste Bus bei der Johann-Kutschera-Gasse fährt._

## General

Stadtbots are not a conversational system, but a request-response bot. It aims to be a simple virtual private assistant,
without any clever dialogs or platonic discussions. Automatic speech recognition (ASR) is provided by the platform,
e.g. by the Amazon’s Alexa engine. The first step of natural language understanding (NLU) is outsourced to the platform.
Only specific locally dependent resources and entities are matched with regular expression based resolution.

### Knowledge Base

The knowledge base is limited to [Aspern Seestadt], one of Europe's largest urban development projects
in the Vienna’s 22nd municipal district. Further expansion to other areas is planned,
but the implementation has not started yet. Stadtbots use the following Open Data sources:

* [Wiener Linien] – CC BY 4.0 – [Reference][Doc-WL]
* [StadtKatalog] – CC BY 4.0 – [Reference][Doc-STK]

## License

Apache 2.0

Before any contribution or pull request contact Philipp Naderer-Puiu.

[Seestadt.bot]: https://seestadt.bot/
[Aspern Seestadt]: https://www.aspern-seestadt.at/en/
[Wiener Linien]: https://www.wienerlinien.at/eportal3/ep/channelView.do/pageTypeId/66528/channelId/-48664
[StadtKatalog]: https://www.stadtkatalog.org/
[Doc-WL]: https://www.data.gv.at/katalog/dataset/wiener-linien-echtzeitdaten-via-datendrehscheibe-wien
[Doc-STK]: https://docs.stadtkatalog.org/
