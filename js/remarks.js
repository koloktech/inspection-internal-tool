/**
 * Suggested rectification remarks for defects.
 *
 * These suggestions are inference-based drafting helpers aligned to:
 * - CIDB / QLASSIC workmanship and quality-assurance principles
 * - CIDB quality-management guidance on tests, inspections, and DLP rectification
 * - common Malaysian building-work rectification practice
 * - Suruhanjaya Tenaga inspection/testing requirements for residential electrical work
 *
 * They are not a substitute for consultant / engineer / specialist instructions.
 */
const CATEGORY_REMARK_BASE = {
    'Wall': [
        'Hack and remove loose / hollow wall plaster where required, re-render / skim affected area, and repaint to a uniform finish matching adjacent surfaces.',
        'Trace and rectify the source of any moisture ingress before making good wall finishes and carrying out final repainting.'
    ],
    'Ceilings': [
        'Cut out and replace defective ceiling finish / board where required, re-secure framing or fixings, and repaint affected area to a uniform finish.',
        'Rectify the source of any leakage above the ceiling, allow the substrate to dry fully, then make good stains, mould, cracks, or damaged finishes.'
    ],
    'Tiles': [
        'Remove and replace defective / hollow / loose / cracked tiles with matching tiles, ensure full bedding / adhesive coverage, and re-grout neatly.',
        'Check tile alignment, joint width, and level after rectification, and carry out tapping inspection before handover.'
    ],
    'Floor': [
        'Rectify floor finish to achieve an even level and proper falls, and replace damaged / hollow / defective floor finishes where required.',
        'Carry out rechecking for levelness, hollowness, and drainage / ponding performance after rectification.'
    ],
    'Plumbing/Sanitary': [
        'Repair or replace defective sanitary fittings, traps, hoses, taps, valves, or pipe connections using compliant materials and make good surrounding finishes neatly.',
        'Carry out flow, flushing, leakage, and pressure checks after rectification to confirm satisfactory operation before handover.'
    ],
    'Doors': [
        'Adjust and realign door leaf, frame, hinges, lockset, and accessories to ensure smooth opening, closing, latching, and uniform gaps.',
        'Repair or replace damaged door components and make good finishes so the appearance matches adjacent completed work.'
    ],
    'Windows': [
        'Adjust and realign window frame, sash, rollers, and lockset to ensure smooth operation, proper closing, and effective weather tightness.',
        'Renew damaged sealant / gaskets / hardware where required and make good wall-frame junctions neatly after rectification.'
    ],
    'Electrical': [
        'Rectification shall be carried out by a competent wireman / electrical contractor, with defective accessories or terminations repaired or replaced using compliant components.',
        'Carry out the applicable inspection and testing after rectification, including continuity, insulation resistance, polarity, earthing, and RCD testing where relevant.'
    ],
    'Gate': [
        'Realign gate leaf, frame / post, hinges, latch, and accessories to ensure smooth operation, proper closing, and uniform gaps.',
        'Treat rusted / corroded surfaces, prepare substrate properly, and repaint / recoat to restore protection and appearance.'
    ],
    'Painting': [
        'Prepare the substrate properly, repair surface defects, apply the required sealer / undercoat, and repaint the full affected panel / area to achieve uniform colour and finish.',
        'All patching and touch-up works shall blend with adjacent surfaces without visible roller marks, brush marks, drips, or shade variation.'
    ],
    'Water Ponding Test': [
        'Rectify the waterproofing / falls / drainage defect at the affected area and repeat the ponding test to confirm no leakage or abnormal water loss.',
        'Make good all affected finishes below / adjacent to the tested area only after the waterproofing rectification has passed re-testing.'
    ],
    'Others': [
        'Investigate the root cause, rectify the defective workmanship / material / installation, and make good all affected finishes before final inspection.',
        'Rectification shall comply with the contract specification, manufacturer requirements, and relevant approved standards, followed by reinspection before handover.'
    ]
};

const GENERIC_REMARK_FALLBACK = [
    'Investigate root cause, rectify defective workmanship / material, make good affected finishes, and re-inspect before handover.'
];

function normalizeRemarkText(value) {
    return (value || '').toLowerCase().trim();
}

function includesAnyPhrase(text, phrases) {
    return phrases.some(phrase => text.includes(phrase));
}

function pushUniqueSuggestions(target, suggestions) {
    suggestions.forEach(suggestion => {
        if (suggestion && !target.includes(suggestion)) {
            target.push(suggestion);
        }
    });
}

function buildRemarkSuggestionsForLine(category, descriptionLine) {
    const text = normalizeRemarkText(descriptionLine);
    const suggestions = [];

    if (!text) return suggestions;

    if (includesAnyPhrase(text, ['hairline crack', 'crack observed at the wall-to-ceiling joint', 'crack observed at the ceiling-to-wall joint', 'hairline cracks observed at the window frame area'])) {
        pushUniqueSuggestions(suggestions, [
            'Open up the crack where necessary, apply suitable crack filler / polymer-modified repair material, make good the surface, and repaint to a uniform finish.',
            'Monitor the affected crack after rectification and investigate further if crack width increases or recurs.'
        ]);
    }

    if (includesAnyPhrase(text, ['horizontal cracks', 'obvious crack suspected to be critical', 'crack point observed'])) {
        pushUniqueSuggestions(suggestions, [
            'Investigate the crack cause and extent immediately; obtain consultant / engineer review if the crack is beyond superficial finishing defect or shows movement.',
            'Carry out the approved crack repair method after investigation, then reinstate finishes and monitor for recurrence.'
        ]);
    }

    if (includesAnyPhrase(text, ['roller marks', 'uneven paint', 'patchy paint', 'paint coverage is inconsistent', 'unfinished paintwork', 'incomplete paintwork', 'paint drips', 'paint bubbling', 'paint peeling', 'paint peeling / flaking', 'paint flaking', 'different paint color', 'different paint colour', 'brush marks', 'touch-up marks', 'unpainted areas', 'visible gap noted along the wall-lining/skirting junction'])) {
        pushUniqueSuggestions(suggestions, [
            'Prepare the surface properly by sanding, patching, cleaning, and priming where required, then repaint the full affected panel / area to achieve even colour and texture.',
            'Ensure final paintwork is free from roller marks, brush marks, patchiness, drips, and visible touch-up lines under normal lighting.'
        ]);
    }

    if (includesAnyPhrase(text, ['surface holes', 'uneven texture', 'inadequate finishing', 'bulging', 'uneven wall surface', 'uneven / sagging ceiling surface'])) {
        pushUniqueSuggestions(suggestions, [
            'Hack back or remove defective uneven finish where required, re-plaster / skim to line, level, and plumb, and repaint after proper curing.',
            'Check the finished surface for evenness and alignment before repainting and handover.'
        ]);
    }

    if (includesAnyPhrase(text, ['gap between wall and window/door frame', 'gap between window frame and wall', 'gap between wall and window', 'gap between floor and skirting', 'gap between tile and wall/skirting junction', 'missing sealant', 'missing silicone sealant', 'not properly sealed'])) {
        pushUniqueSuggestions(suggestions, [
            'Clean the joint, provide backing material where necessary, apply approved sealant neatly and continuously, and make good adjacent finishes.',
            'Ensure all perimeter joints are properly sealed, visually neat, and free from gaps or voids after rectification.'
        ]);
    }

    if (includesAnyPhrase(text, ['stain observed', 'water marks', 'water stain marks', 'water seepage', 'slow seepage', 'mould', 'fungal growth', 'efflorescence', 'discoloration observed'])) {
        pushUniqueSuggestions(suggestions, [
            'Identify and stop the source of water ingress / dampness first, allow the affected substrate to dry adequately, then treat and reinstate damaged finishes.',
            'Clean and treat mould / efflorescence / staining as appropriate and repaint / replace the affected finish only after the moisture source has been rectified.'
        ]);
    }

    if (includesAnyPhrase(text, ['hollow concrete', 'hollow sound', 'hollow tiles', 'hollow floor', 'loose tile detected upon tapping', 'hollow tiles detected during tapping test'])) {
        pushUniqueSuggestions(suggestions, [
            category === 'Tiles' || category === 'Floor'
                ? 'Hack out and replace hollow / loose tile or floor finish, ensure proper substrate preparation and full bedding coverage, then re-grout / make good neatly.'
                : 'Hack and remove hollow / debonded plaster or finish, prepare the substrate properly, reinstate the affected area, and recheck by tapping test.',
            'Extend inspection to the surrounding area and confirm adjacent portions are sound before final handover.'
        ]);
    }

    if (includesAnyPhrase(text, ['chipped', 'damaged plaster', 'damaged door surface', 'damaged gate surface', 'scratched tile surface', 'scratched / damaged window glass', 'scratches observed on the floor surface'])) {
        pushUniqueSuggestions(suggestions, [
            'Repair or replace the damaged component / finish as appropriate and make good to match adjacent completed work in appearance and performance.',
            'Where local patch repair cannot achieve acceptable appearance, replace the full affected piece / panel / tile / glass.'
        ]);
    }

    if (includesAnyPhrase(text, ['uneven tile surface', 'lippage', 'misaligned tile layout', 'floor level difference', 'uneven floor surface', 'improper gradient', 'water not draining'])) {
        pushUniqueSuggestions(suggestions, [
            'Take up and relay the affected finishes / tiles as required to achieve proper line, level, joint alignment, and drainage falls.',
            'Verify the finished surface for levelness and drainage performance after rectification.'
        ]);
    }

    if (includesAnyPhrase(text, ['missing / incomplete grouting', 'stained / discolored grout lines'])) {
        pushUniqueSuggestions(suggestions, [
            'Remove loose / stained grout where necessary and re-grout the affected joints fully, neatly, and to consistent joint width and depth.',
            'Clean residual grout haze / stains and ensure the final grout finish is uniform and intact.'
        ]);
    }

    if (includesAnyPhrase(text, ['water ponding observed on the floor surface', 'water ponding test', 'water level dropping', 'leakage detected', 'ponding area shows improper gradient'])) {
        pushUniqueSuggestions(suggestions, [
            'Rectify the waterproofing layer and / or floor falls to direct water effectively to the outlet, then repeat the ponding test for confirmation.',
            'Do not close up or hand over the area until the re-test confirms no leakage and no unacceptable ponding.'
        ]);
    }

    if (includesAnyPhrase(text, ['active leakage', 'dripping', 'leaking', 'water seepage through window frame during rain'])) {
        pushUniqueSuggestions(suggestions, [
            'Repair or replace the defective joint / fitting / hose / seal / gasket, ensure proper installation, and carry out leakage test after rectification.',
            'Make good any surrounding finishes affected by leakage only after the source of leakage has been fully rectified.'
        ]);
    }

    if (includesAnyPhrase(text, ['poor water pressure', 'not flushing properly', 'weak flush', 'slow drainage', 'drain blockage', 'floor trap not functioning'])) {
        pushUniqueSuggestions(suggestions, [
            'Check and rectify the affected fitting / trap / valve / blockage / flush mechanism, then verify satisfactory flow, flushing, and drainage performance.',
            'Carry out functional testing after rectification to confirm water supply and discharge perform properly under normal use.'
        ]);
    }

    if (includesAnyPhrase(text, ['pipe fitting loose', 'shower head fitting loose', 'loose upon inspection', 'loose / damaged socket cover plate', 'ceiling fan wobbling'])) {
        pushUniqueSuggestions(suggestions, [
            'Tighten, secure, and re-fix the affected component with the correct fixings / supports, and replace defective parts where necessary.',
            'Confirm the item is firmly installed, safe to operate, and free from abnormal movement after rectification.'
        ]);
    }

    if (includesAnyPhrase(text, ['missing / damaged pipe cover / cap', 'door stopper missing', 'rubber seal / gasket damaged / missing', 'mosquito mesh damaged / not fitted properly', 'missing component / fitting'])) {
        pushUniqueSuggestions(suggestions, [
            'Supply and install the missing / damaged accessory or fitting with the correct compatible component and make good surrounding finishes neatly.',
            'Ensure the replaced accessory is properly aligned, secured, and fully functional before handover.'
        ]);
    }

    if (includesAnyPhrase(text, ['door not closing', 'door rubbing', 'window not closing', 'window handle / latch not functioning', 'door lock / handle not functioning', 'gate not closing', 'gate lock / latch not functioning', 'auto-closer not functioning', 'not functioning properly', 'physically difficult to press'])) {
        pushUniqueSuggestions(suggestions, [
            'Adjust, realign, lubricate, and repair or replace the affected hardware / mechanism so the item operates smoothly and as intended.',
            'Verify full functional operation, including opening, closing, latching, locking, switching, or flushing, after rectification.'
        ]);
    }

    if (includesAnyPhrase(text, ['uneven gap between door and door frame', 'uneven gap between gate panels', 'gate post not properly aligned / leaning'])) {
        pushUniqueSuggestions(suggestions, [
            'Realign the affected frame / post / leaf and adjust ironmongery so the gaps are even and operation is smooth.',
            'Check that the final alignment is plumb, stable, and visually acceptable.'
        ]);
    }

    if (includesAnyPhrase(text, ['termite', 'frass', 'fecal pellets', 'mud tubes', 'termite galleries', 'termite tunnels', 'wood consumption', 'timber sub-structure', 'termite attack', 'termite damage', 'termite infestation', 'honeycombed appearance'])) {
        pushUniqueSuggestions(suggestions, [
            'Developer to engage a licensed pest control specialist (MAPHMA / DOA-registered) to carry out immediate inspection, identification of termite species, and treatment of the affected area using an approved termiticide regime (soil / baiting / foaming as appropriate).',
            'Remove and replace all termite-damaged timber components (door leaf, door frame, skirting, wall lining, architraves) with properly treated / pressure-impregnated timber or approved termite-resistant substitute, and make good all affected finishes to match adjacent completed work.',
            'Developer to provide chemical soil treatment / anti-termite barrier to the affected area in accordance with the anti-termite warranty specified under the S&P/SPA, and furnish updated treatment certification and warranty to the purchaser.',
            'Carry out follow-up inspection after treatment to confirm no recurrence of active termite activity before final handover.'
        ]);
    }

    if (includesAnyPhrase(text, ['rainwater downpipe', 'rain drain water pipe', 'rain drain pipe', 'downpipe not connected', 'discharge roof', 'uncontrolled runoff', 'uncontrolled water discharge', 'ponding around the slab'])) {
        pushUniqueSuggestions(suggestions, [
            'Developer to supply and install the missing rainwater downpipe, complete with proper fixing brackets, connections to the roof gutter / rainwater outlet, and discharge into the designated surface drain / drainage outlet in accordance with the approved drainage layout and UBBL / MS 1228 requirements.',
            'Rectification must prevent roof / gutter runoff from splashing onto external walls or ponding at the slab edge, to avoid wall dampness, efflorescence, paint peeling, slab edge erosion, and long-term structural deterioration.',
            'Carry out a water discharge / flow test after installation to confirm rainwater is properly channelled from the roof gutter to the drainage outlet with no leakage, overflow, or ponding at the building perimeter.',
            'Make good all affected external wall finishes (paint, render, coating) only after the downpipe installation has been completed and tested satisfactorily.'
        ]);
    }

    if (includesAnyPhrase(text, ['swollen / warped door panel due to moisture'])) {
        pushUniqueSuggestions(suggestions, [
            'Identify and rectify the moisture source, then repair or replace the swollen / warped door panel if acceptable operation and finish cannot be restored.',
            'Ensure the replacement / repaired door closes properly with uniform gaps and matching finish.'
        ]);
    }

    if (includesAnyPhrase(text, ['window sliding track dirty / obstructed'])) {
        pushUniqueSuggestions(suggestions, [
            'Clean the track thoroughly, remove obstructions, adjust rollers where required, and verify smooth sliding operation.',
            'Replace worn rollers or damaged track components if cleaning and adjustment do not restore proper operation.'
        ]);
    }

    if (includesAnyPhrase(text, ['power socket found to be loose', 'light switch not functioning', 'light fitting / bulb not working', 'water heater unit not functioning', 'doorbell not functioning', 'socket tester showing wiring fault', 'earthing / grounding issue'])) {
        pushUniqueSuggestions(suggestions, [
            'Electrical rectification shall be carried out by a competent wireman, including repair / replacement of defective accessories, tightening of terminations, and correction of wiring faults.',
            'Carry out and record the relevant electrical tests after rectification, including continuity, insulation resistance, polarity, earthing, and RCD performance as applicable.'
        ]);
    }

    if (includesAnyPhrase(text, ['exposed wiring observed'])) {
        pushUniqueSuggestions(suggestions, [
            'Make safe immediately, enclose / reroute / terminate the exposed wiring properly, and reinstate covers or containment in accordance with the approved wiring method.',
            'The circuit shall be re-tested and confirmed safe before it is energised for use.'
        ]);
    }

    if (includesAnyPhrase(text, ['db box exhibits unpainted areas and accumulated debris'])) {
        pushUniqueSuggestions(suggestions, [
            'Clean the DB box area, remove debris, make good the surrounding finishes, and ensure all labeling / covers / components are complete and accessible.',
            'Do not paint over active electrical components; any finishing works shall not impair safe access, operation, or inspection.'
        ]);
    }

    if (includesAnyPhrase(text, ['rust', 'corrosion', 'rusty / squeaking'])) {
        pushUniqueSuggestions(suggestions, [
            'Remove rust / corrosion, treat the affected metal surface, apply suitable anti-rust protection, and repaint / recoat to restore the protective finish.',
            'Lubricate moving metal parts after cleaning and verify smooth operation.'
        ]);
    }

    if (includesAnyPhrase(text, ['scratched / damaged window glass'])) {
        pushUniqueSuggestions(suggestions, [
            'Replace the scratched / damaged glass panel where the defect is visually apparent and cannot be satisfactorily polished out.',
            'Ensure the replacement glass is properly seated, sealed, and free from damage before handover.'
        ]);
    }

    if (includesAnyPhrase(text, ['cleaning required', 'debris / construction waste left'])) {
        pushUniqueSuggestions(suggestions, [
            'Clear all debris / waste / leftover materials from the affected area and complete final cleaning before handover.',
            'Ensure the area is left in clean, safe, and presentable condition after rectification works.'
        ]);
    }

    if (includesAnyPhrase(text, ['safety concern identified'])) {
        pushUniqueSuggestions(suggestions, [
            'Attend to the safety issue immediately, isolate / make safe the affected area where necessary, and rectify the defect before use or handover.',
            'Confirm the rectified item complies with the relevant safety requirement and poses no residual hazard to occupants.'
        ]);
    }

    if (includesAnyPhrase(text, ['incomplete work noted', 'defect observed at the affected area'])) {
        pushUniqueSuggestions(suggestions, [
            'Complete the outstanding work fully in accordance with the approved specification and make good all surrounding finishes before final inspection.',
            'Carry out reinspection after completion to verify workmanship and functionality are acceptable.'
        ]);
    }

    if (includesAnyPhrase(text, ['missing / uninstalled', 'missing / incomplete painting'])) {
        const missingRemarks = {
            'Wall': [
                'Developer to ensure all required wall-mounted components (skirting, cove, corner guard, wall panel) are supplied and installed as per agreed S&P/SPA specification.',
                'Verify installation is complete, properly aligned, and finished neatly before handover.'
            ],
            'Ceilings': [
                'Developer to ensure all required ceiling components (ceiling panel, access panel, cornice, light fitting) are supplied and installed as per agreed S&P/SPA specification.',
                'Verify installation is secure, properly aligned, and finished neatly before handover.'
            ],
            'Tiles': [
                'Developer to ensure all required tiles are supplied and installed at the affected area as per agreed S&P/SPA specification.',
                'Ensure tile installation achieves proper adhesion, alignment, grouting, and finish matching the surrounding completed work.'
            ],
            'Floor': [
                'Developer to ensure all required floor components (skirting, floor trap cover, threshold strip) are supplied and installed as per agreed S&P/SPA specification.',
                'Verify installation is complete, level, and finished neatly before handover.'
            ],
            'Plumbing/Sanitary': [
                'Developer to ensure all required sanitary ware and plumbing components (basin, WC, shower set, tap, towel rail, toilet roll holder, soap dish, mirror) are supplied and installed as per agreed S&P/SPA specification.',
                'Carry out functional testing (flow, flushing, leakage, drainage) on all newly installed sanitary fittings to confirm satisfactory operation before handover.'
            ],
            'Doors': [
                'Developer to ensure all required door components (door leaf, handle, lock set, door stopper, hinges, door closer) are supplied and installed as per agreed S&P/SPA specification.',
                'Verify the installed door operates smoothly with proper closing, latching, locking, and uniform gaps before handover.'
            ],
            'Windows': [
                'Developer to ensure all required window components (handle, latch, mosquito mesh, glass panel, rubber seal) are supplied and installed as per agreed S&P/SPA specification.',
                'Verify the installed window operates smoothly with proper closing, locking, and weather tightness before handover.'
            ],
            'Electrical': [
                'Developer to ensure all required electrical components (socket, switch, light fitting, DB cover, doorbell, water heater) are supplied and installed as per agreed S&P/SPA specification.',
                'Electrical installation shall be carried out by a competent wireman, with applicable testing (continuity, insulation resistance, polarity, earthing) completed before handover.'
            ],
            'Gate': [
                'Developer to ensure all required gate components (gate leaf, lock, latch, auto-closer, post cap) are supplied and installed as per agreed S&P/SPA specification.',
                'Verify the installed gate operates smoothly with proper closing, latching, and uniform gaps before handover.'
            ],
            'Painting': [
                'Developer to ensure all required painting works are completed at the affected area as per agreed S&P/SPA specification.',
                'Final paintwork shall achieve uniform colour and finish, free from roller marks, brush marks, patchiness, and visible touch-up lines.'
            ],
            'Water Ponding Test': [
                'Developer to ensure all required waterproofing components (floor trap, outlet, membrane upturn) are supplied and installed at the tested area as per agreed S&P/SPA specification.',
                'Repeat the ponding test after installation to confirm no leakage or abnormal water loss before handover.'
            ],
            'Others': [
                'Developer to ensure all required materials / components / fittings are supplied and installed as per agreed S&P/SPA specification.',
                'Carry out reinspection after installation to verify completeness, workmanship, and functionality are acceptable before handover.'
            ]
        };

        if (category && missingRemarks[category]) {
            pushUniqueSuggestions(suggestions, missingRemarks[category]);
        } else {
            pushUniqueSuggestions(suggestions, missingRemarks['Others']);
        }
    }

    if (suggestions.length === 0) {
        pushUniqueSuggestions(suggestions, GENERIC_REMARK_FALLBACK);
    }

    return suggestions;
}

function getRectificationRemarkSuggestions(categoriesOrString, descriptionText) {
    const categories = normalizeDefectCategoriesInput(categoriesOrString);
    const suggestions = [];
    const lines = (descriptionText || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    categories.forEach(category => {
        if (CATEGORY_REMARK_BASE[category]) {
            pushUniqueSuggestions(suggestions, CATEGORY_REMARK_BASE[category]);
        }
    });

    lines.forEach(line => {
        if (categories.length === 0) {
            pushUniqueSuggestions(suggestions, buildRemarkSuggestionsForLine('', line));
            return;
        }

        categories.forEach(category => {
            pushUniqueSuggestions(suggestions, buildRemarkSuggestionsForLine(category, line));
        });
    });

    if (suggestions.length === 0 && categories.length > 0) {
        pushUniqueSuggestions(suggestions, GENERIC_REMARK_FALLBACK);
    }

    return suggestions;
}
