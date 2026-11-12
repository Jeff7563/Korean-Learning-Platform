# V0.3A learning media sources

Curated for the 10 existing Hangul lessons. Video titles and channel names were checked against YouTube's public oEmbed metadata on 2026-11-12. OpenHangul resource titles and Thai subject matter were checked on the original lesson pages on 2026-11-12. The application links to third-party sources; it does not download, rehost, or claim ownership of their media.

| Lesson | Verified resources | Fit |
| --- | --- | --- |
| รู้จัก 한글 | [KHEM KOREA: ภาษาเกาหลี พื้นฐาน 1 : สระ พยัญชนะ ตัวสะกด สำหรับผู้เริ่มต้น 💖 คลิปเดียวอ่านเกาหลีได้!🔥](https://www.youtube.com/watch?v=hVnDpNqWwDc); [OpenHangul: ฮันกึลทำงานอย่างไร](https://hangul.openblog.com/th/lesson/hangul-overview) | Thai overview of vowels, consonants, blocks, and final consonants |
| สระพื้นฐาน | KHEM KOREA: พื้นฐาน 1; [OpenHangul: สระพื้นฐาน I](https://hangul.openblog.com/th/lesson/hangul-vowels-1) | Six basic vowels, mouth shape, and reading |
| พยัญชนะพื้นฐาน | KHEM KOREA: พื้นฐาน 1; [OpenHangul: พยัญชนะพื้นฐาน I](https://hangul.openblog.com/th/lesson/hangul-consonants-1); [พยัญชนะพื้นฐาน II](https://hangul.openblog.com/th/lesson/hangul-consonants-2) | Basic consonant sets; the two Thai pages cover the ten letters taught here |
| ประกอบพยัญชนะกับสระ | [OpenHangul: ฮันกึลทำงานอย่างไร](https://hangul.openblog.com/th/lesson/hangul-overview); OpenHangul: สระพื้นฐาน I | How consonants and vowels form syllable blocks |
| สระเพิ่มเติม | [OpenHangul: สระประสม I](https://hangul.openblog.com/th/lesson/hangul-compound-vowels-1); [สระประสม II](https://hangul.openblog.com/th/lesson/hangul-compound-vowels-2) | Relevant compound vowel groups taught in this lesson |
| พยัญชนะตึงและพ่นลม | [OpenHangul: พยัญชนะเสียงหนัก](https://hangul.openblog.com/th/lesson/hangul-aspirated); [พยัญชนะเสียงตึง](https://hangul.openblog.com/th/lesson/hangul-tense) | Separate Thai explanations for aspirated and tense consonants |
| โครงสร้างบล็อกพยางค์ | [OpenHangul: ฮันกึลทำงานอย่างไร](https://hangul.openblog.com/th/lesson/hangul-overview); OpenHangul: สระพื้นฐาน I | Syllable structure and horizontal/vertical vowel placement |
| รู้จักตัวสะกด (받침) | KHEM KOREA: พื้นฐาน 1; [OpenHangul: พยัญชนะท้าย (พัชชิม)](https://hangul.openblog.com/th/lesson/hangul-batchim-1) | The video title includes final consonants; the Thai page focuses on batchim |
| ฝึกอ่านคำพื้นฐาน | [KHEM KOREA: ภาษาเกาหลี พื้นฐาน 2 : 100 แบบฝึกอ่านคำเกาหลี สำหรับคนเริ่มอ่าน! 🥰](https://www.youtube.com/watch?v=1MMOYfIWcmM); [OpenHangul: ฝึกอ่านป้าย เมนู และชื่อ](https://hangul.openblog.com/th/lesson/hangul-reading) | Beginner reading drills and applied reading examples |
| ทบทวนพื้นฐานฮันกึล | KHEM KOREA: พื้นฐาน 1 and พื้นฐาน 2; OpenHangul: overview and reading pages | Revisit letters, syllable structure, final consonants, and short reading |

## Verified but not assigned

- [KHEM KOREA, ภาษาเกาหลี พื้นฐาน 3 : วิธีฝึกพูดเกาหลีอย่างง่าย เริ่มจากศูนย์!💬](https://www.youtube.com/watch?v=nho-R4Wtw9w) is a beginner speaking resource, but none of the ten current Hangul lessons teaches conversation, so it is not presented as a match.
- [Learn the Hangul Song, Korean Alphabet, Songs & Movement, Speak Beginner Korean with King Sejong](https://www.youtube.com/watch?v=BbLRZqnryHg) reports the channel **Learn Korean with Woori Show!** in YouTube metadata, not King Sejong Institute Foundation. It is not assigned as an official KSIF resource.
- [HRD Korea's official EPS-TOPIK textbook/listening download page](https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=en) is offered as an optional long-term listening resource in the final review lesson. Its recordings are not specific to the current Hangul objectives. The source page identifies its material under KOGL Type 3 (attribution, no modification); the app links to the source and does not copy or bundle any recordings.

## Listening implementation

The lesson player uses the browser Web Speech API only when speech synthesis and its utterance API exist and the browser reports a Korean (`ko-*`) voice. The selected voice name and language are shown. Playback is explicitly labeled as synthesized browser speech; it is not represented as a recording or native-speaker audio. If no Korean voice is available, the words, Thai explanations, and repeat-practice instructions remain available and the audio controls are disabled. The final Hangul review also links to HRD Korea's official EPS-TOPIK listening materials as an optional next-step resource. No pronunciation scoring is implemented.

## Coverage

All 10 lessons have at least one verified relevant video or external instructional page. The catalog records resource type, direct source URL, creator, language, check date, and verification method. YouTube playback availability can still vary by browser, network, region, and source settings; every embedded video also has an original-source link.
