let projects = [
    {
        id: 1,
        name: 'Doe Breast Cancer Risk and Air Pollution',
        abbrev: 'DOEBCR',
        study_design: 'cohort',
        endpoint: 'cancer',
        biospecimens: true,
        geospatial_data: false,
        users: []
    },{
        id: 2,
        name: 'Head and Neck Cancer Study',
        abbrev: 'HNCS',
        study_design: 'case-control',
        endpoint: 'hospitalization',
        biospecimens: false,
        geospatial_data: true,
        users: []
    },{
        id: 3,
        name: 'Lung Cancel Risk and Smoking ',
        abbrev: 'LCRS',
        study_design: 'cross-sectional',
        endpoint: 'mortality',
        biospecimens: true,
        geospatial_data: true,
        users: []
    }
];

export default projects;