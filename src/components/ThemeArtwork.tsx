import type { Motif } from '../themes';

/** Small, original vector decorations. Nothing is fetched from another website. */
export default function ThemeArtwork({ motif }: { motif: Motif }) {
  if (motif === 'none') return null;
  const flower = <g fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.4" strokeOpacity=".45">{Array.from({ length: 8 }, (_, index) => <ellipse key={index} cx="0" cy="-18" rx="8" ry="18" transform={`rotate(${index * 45})`} />)}<circle r="6" fillOpacity=".4" /></g>;
  const leaf = <g stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity=".12" strokeOpacity=".4"><path d="M0 90Q40 30 10-25" fill="none" />{[0, 1, 2, 3].map(index => <g key={index} transform={`translate(${index * 3} ${index * 23})`}><ellipse cx="-7" rx="7" ry="16" transform="rotate(-40)" /><ellipse cx="15" cy="2" rx="7" ry="16" transform="rotate(38)" /></g>)}</g>;
  return <svg className="theme-artwork" viewBox="0 0 794 1123" preserveAspectRatio="none" aria-hidden="true">
    {motif === 'wave' && <g fill="currentColor"><path opacity=".1" d="M0 0H260Q70 20 35 180Q15 250 0 300Z" /><path opacity=".22" d="M0 0H110Q20 70 0 195Z" /><path opacity=".12" d="M794 1123H480Q730 1090 758 943Q778 878 794 820Z" /></g>}
    {motif === 'frame' && <g fill="none" stroke="currentColor" strokeOpacity=".45"><path strokeWidth="3" d="M25 180V25H210M584 25H769V200M769 923V1098H590M210 1098H25V943" /><path d="M35 120V35H180M620 35H759V160M759 963V1088H620M170 1088H35V983" /></g>}
    {motif === 'grain' && <g fill="none" stroke="currentColor" strokeOpacity=".1">{Array.from({ length: 8 }, (_, i) => <path key={i} strokeWidth="3" d={`M${i * 6} 0Q${55 - i * 4} 220 ${i * 4} 400T${i * 5} 780T${i * 5} 1123M${794 - i * 6} 0Q${744 + i * 4} 220 ${794 - i * 4} 400T${794 - i * 5} 780T${794 - i * 5} 1123`} />)}</g>}
    {motif === 'shade' && <g fill="currentColor"><path opacity=".08" d="M0 0H220L0 220ZM794 1123H560L794 889Z" /><path opacity=".12" d="M0 0H120L0 120ZM794 1123H674L794 1003Z" /></g>}
    {motif === 'flame' && <g fill="currentColor" fillOpacity=".12"><path d="M0 0H45Q0 140 38 245Q10 175 0 210ZM794 1123H745Q788 940 758 855Q790 930 794 910Z" /><path d="M0 75Q65 140 15 250Q37 170 0 160ZM794 1048Q729 983 779 873Q757 953 794 963Z" /></g>}
    {(motif === 'flower' || motif === 'rose') && <><g transform="translate(45 43)">{flower}</g><g transform="translate(750 1080)">{flower}</g>{motif === 'rose' && <><g transform="translate(25 45)">{leaf}</g><g transform="translate(769 1075) rotate(180)">{leaf}</g></>}</>}
    {motif === 'leaf' && <><g transform="translate(19 75)">{leaf}</g><g transform="translate(775 1048) rotate(180)">{leaf}</g></>}
    {motif === 'velvet' && <g fill="none" stroke="currentColor" strokeOpacity=".45"><path strokeWidth="2" d="M40 75V40H155M639 40H754V75M754 1048V1083H639M155 1083H40V1048" /><path d="M55 50Q30 10 23 40Q20 60 55 50Q20 90 40 95Q65 90 55 50M739 1073Q764 1113 771 1083Q774 1063 739 1073Q774 1033 754 1028Q729 1033 739 1073" /></g>}
    {motif === 'temple' && <g fill="none" stroke="currentColor" strokeOpacity=".42"><path strokeWidth="2" d="M38 1090V75H25L65 33L105 75H92M702 1090V75H689L729 33L769 75H756" /><path d="M35 75H95M699 75H759M65 33V18M729 33V18M28 1090H102M692 1090H766" /></g>}
    {motif === 'ganesha' && <g transform="translate(397 28)" fill="none" stroke="currentColor" strokeOpacity=".75" strokeWidth="1.7" strokeLinecap="round"><path d="M-5-4Q-28-12-23 9Q-18 22-9 11M5-4Q28-12 23 9Q18 22 9 11M-7-5Q0-13 7-5L5 13Q-1 28 10 24Q17 22 12 17M-4 2H-3M4 2H5M-6-9L0-16L6-9M-14 23Q-27 29-15 30H17" /></g>}
    {motif === 'lotus' && <g transform="translate(397 29)" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".5"><path d="M0 16Q-20-6 0-21Q20-6 0 16ZM0 16Q-30 15-32-10Q-9-9 0 16ZM0 16Q30 15 32-10Q9-9 0 16ZM0 16Q-34 29-47 9Q-20 2 0 16ZM0 16Q34 29 47 9Q20 2 0 16Z" /></g>}
    {motif === 'arch' && <path d="M28 1092V132Q28 28 132 28H662Q766 28 766 132V1092" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity=".35" />}
    {motif === 'ribbon' && <g fill="currentColor" fillOpacity=".16"><path d="M0 0H36V160L18 145L0 160ZM794 1123H758V963L776 978L794 963Z" /></g>}
    {motif === 'diamond' && <g fill="none" stroke="currentColor" strokeOpacity=".4"><path d="M31 43L43 31L55 43L43 55ZM739 1080L751 1068L763 1080L751 1092Z" /><path d="M63 43H310M43 63V260M731 1080H484M751 1060V863" /></g>}
  </svg>;
}
