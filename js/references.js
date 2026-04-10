/**
 * Official standards / guidance references used as the basis for inspection and
 * rectification suggestions in this tool.
 */
const REFERENCE_URLS = {
    qlassic: 'https://smart.cidb.gov.my/en-GB/program/qlassic',
    cis: 'https://www.cidb.gov.my/eng/construction-industry-standard-cis/',
    quality: 'https://www.cidb.gov.my/jombinasempurna/panduan-kontraktor/pengurusan-kualiti/',
    plumbingElectricalGuide: 'https://www.cidb.gov.my/jombinasempurna/panduan/kerja-kerja-kepakaran-paip-dan-elektrik/',
    electrical: 'https://www.st.gov.my/en/contents/publications/guidelines_electricity/guidelines%20for%20electrical%20wiring%20in%20residential%20buildings%20.pdf',
    materials: 'https://www.cidb.gov.my/eng/construction-material/'
};

const STANDARDS_REFERENCES = [
    {
        title: 'CIDB Malaysia - Quality Assessment System for Building Construction Works (QLASSIC)',
        url: REFERENCE_URLS.qlassic,
        description: 'CIDB official QLASSIC program page covering the quality assessment framework for building workmanship.'
    },
    {
        title: 'CIDB Malaysia - Construction Industry Standards (CIS)',
        url: REFERENCE_URLS.cis,
        description: 'CIDB official CIS portal for published construction industry standards and related references.'
    },
    {
        title: 'CIDB Malaysia - Quality Management Guidance',
        url: REFERENCE_URLS.quality,
        description: 'CIDB quality-management guidance relevant to inspections, testing, defect management, and rectification practices.'
    },
    {
        title: 'CIDB Malaysia - Plumbing and Electrical Specialist Works Guide',
        url: REFERENCE_URLS.plumbingElectricalGuide,
        description: 'CIDB guide for homeowners on plumbing and electrical specialist works, quality checks, and applicable standards.'
    },
    {
        title: 'Suruhanjaya Tenaga - Guidelines for Electrical Wiring in Residential Buildings',
        url: REFERENCE_URLS.electrical,
        description: 'Official electrical wiring guidance relevant to inspection, rectification, and testing of residential electrical works.'
    },
    {
        title: 'CIDB Malaysia - Construction Materials Compliance and Standards References',
        url: REFERENCE_URLS.materials,
        description: 'CIDB materials compliance page relevant to approved building materials and standards-linked product references.'
    }
];

const COMMON_QLASSIC_GUIDE = {
    title: 'CIDB QLASSIC - Workmanship Quality Benchmark',
    url: REFERENCE_URLS.qlassic,
    quote: '"Assessment of workmanship quality based on the relevant approved standard."',
    note: 'Useful as the general workmanship benchmark for finishing quality, alignment, and visible defects.'
};

const COMMON_QUALITY_GUIDE = {
    title: 'CIDB Quality Management - Defect Rectification and Quality Checks',
    url: REFERENCE_URLS.quality,
    quote: '"kontraktor wajib melaksanakan pembetulan segera."',
    note: 'Relevant as a general defect-rectification and quality-management expectation during inspection and DLP corrections.'
};

const CATEGORY_REFERENCE_GUIDES = {
    'Wall': [
        COMMON_QLASSIC_GUIDE,
        {
            title: 'CIDB Quality Management - Wall Finishing Check',
            url: REFERENCE_URLS.quality,
            quote: '"Ujian Dinding: Ujian cahaya selepas lepa..."',
            note: 'Useful for wall plaster, skim coat, patchwork, waviness, and visible finishing imperfections.'
        }
    ],
    'Ceilings': [
        COMMON_QLASSIC_GUIDE,
        {
            title: 'CIDB Quality Management - Roof / Ceiling Water Check',
            url: REFERENCE_URLS.quality,
            quote: '"Ujian Bumbung: Ujian siraman air..."',
            note: 'Useful where ceiling staining, seepage, leakage trace, or poor make-good may relate to roof / waterproofing defects.'
        }
    ],
    'Tiles': [
        COMMON_QLASSIC_GUIDE,
        {
            title: 'CIDB Construction Materials - Ceramic Tile Standards',
            url: REFERENCE_URLS.materials,
            quote: '"Ceramic Tile ... MS ISO 13006"',
            note: 'Useful for tile-related defects involving ceramic tile compliance, installation quality, and material suitability.'
        }
    ],
    'Floor': [
        COMMON_QLASSIC_GUIDE,
        {
            title: 'CIDB Quality Management - Floor Water / Fall Check',
            url: REFERENCE_URLS.quality,
            quote: '"Ujian Lantai: Siraman air..."',
            note: 'Useful for uneven floor finish, falls, drainage, ponding, and related floor workmanship issues.'
        }
    ],
    'Plumbing/Sanitary': [
        {
            title: 'CIDB Plumbing Specialist Works Guide',
            url: REFERENCE_URLS.plumbingElectricalGuide,
            quote: '"Mesti mematuhi Piawaian MS 1402:1997"',
            note: 'Useful for internal plumbing workmanship, water supply installation, and checking whether fittings are properly installed.'
        },
        {
            title: 'CIDB Plumbing Quality Checks',
            url: REFERENCE_URLS.plumbingElectricalGuide,
            quote: '"Tiada Kebocoran"',
            note: 'Useful for leaks, drainage, flushing, water pressure, and post-installation plumbing performance checks.'
        },
        {
            title: 'CIDB Construction Materials - Sanitaryware Standards',
            url: REFERENCE_URLS.materials,
            quote: '"Sanitarywares MS 147/ MS 1522/ MS 795"',
            note: 'Useful where sanitary fittings, fixtures, or material compliance are relevant to the defect.'
        }
    ],
    'Doors': [
        COMMON_QLASSIC_GUIDE,
        COMMON_QUALITY_GUIDE
    ],
    'Windows': [
        COMMON_QLASSIC_GUIDE,
        {
            title: 'CIDB Construction Materials - Glass Standards',
            url: REFERENCE_URLS.materials,
            quote: '"MS 1135 / MS 2397 / MS 1498"',
            note: 'Useful where the defect concerns glass quality, glazing, or window material compliance.'
        }
    ],
    'Electrical': [
        {
            title: 'Suruhanjaya Tenaga - Residential Wiring Guideline',
            url: REFERENCE_URLS.electrical,
            quote: '"to conform to the Electricity Regulations 1994."',
            note: 'Useful for electrical installations, accessory workmanship, and compliance with residential wiring requirements.'
        },
        {
            title: 'Suruhanjaya Tenaga - Installation Quality and Safety',
            url: REFERENCE_URLS.electrical,
            quote: '"tidy, neat and safe to be used."',
            note: 'Useful where the issue concerns poor installation workmanship, exposed wiring, loose accessories, or unsafe arrangement.'
        },
        {
            title: 'CIDB Electrical Specialist Works Guide',
            url: REFERENCE_URLS.plumbingElectricalGuide,
            quote: '"Pendawaian elektrik harus diuji dan diperiksa"',
            note: 'Useful where switch, socket, earthing, or testing / inspection requirements are relevant.'
        }
    ],
    'Gate': [
        COMMON_QLASSIC_GUIDE,
        COMMON_QUALITY_GUIDE
    ],
    'Painting': [
        COMMON_QLASSIC_GUIDE,
        {
            title: 'CIDB Quality Management - Wall Finishing Check',
            url: REFERENCE_URLS.quality,
            quote: '"Ujian Dinding: Ujian cahaya selepas lepa..."',
            note: 'Useful for poor patching, uneven paint finish, poor workmanship, and visible finishing defects under light.'
        }
    ],
    'Water Ponding Test': [
        {
            title: 'CIDB Quality Management - Floor Water Check',
            url: REFERENCE_URLS.quality,
            quote: '"Ujian Lantai: Siraman air..."',
            note: 'Useful for floor falls, drainage, ponding behaviour, and water movement across finished surfaces.'
        },
        {
            title: 'CIDB Quality Management - Roof Water Check',
            url: REFERENCE_URLS.quality,
            quote: '"Ujian Bumbung: Ujian siraman air..."',
            note: 'Useful where waterproofing, leakage, or repeated water-testing logic is relevant to the defect.'
        }
    ],
    'Others': [
        COMMON_QLASSIC_GUIDE,
        COMMON_QUALITY_GUIDE
    ]
};

function getCategoryReferenceGuides(categoriesOrString) {
    const categories = normalizeDefectCategoriesInput(categoriesOrString);
    const guides = [];
    const seen = new Set();

    categories.forEach(category => {
        (CATEGORY_REFERENCE_GUIDES[category] || []).forEach(guide => {
            const key = `${guide.title}|${guide.url}|${guide.quote}`;
            if (seen.has(key)) return;
            seen.add(key);
            guides.push(guide);
        });
    });

    return guides;
}
