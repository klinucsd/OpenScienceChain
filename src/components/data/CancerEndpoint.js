import React from 'react';
import 'antd/dist/antd.css';
import {Select, Table, Checkbox, Modal, Button} from 'antd';
import {InfoCircleOutlined} from '@ant-design/icons';
import './index.css';
import './cancer_endpoint.css';
import site_groups_name from '../../model/site_group_name';
import axios from 'axios';

const {Option, OptGroup} = Select;

const categorized_site_group_names = [
    {
        category: 'Oral Cavity and Pharynx',
        names: ['Lip', 'Tongue', 'Salivary Gland', 'Floor of Mouth', 'Gum and Other Mouth',
            'Nasopharynx', 'Tonsil', 'Oropharynx', 'Hypopharynx', 'Other Oral Cavity and Pharynx']
    },
    {
        category: 'Digestive System',
        names: ['Esophagus', 'Stomach', 'Small Intestine']
    },
    {
        category: 'Colon and Rectum',
        names: ['Cecum', 'Appendix', 'Ascending Colon', 'Hepatic Flexure',
            'Transverse Colon', 'Splenic Flexure', 'Descending Colon', 'Sigmoid Colon',
            'Large Intestine, NOS', 'Rectosigmoid Junction', 'Rectum']
    },
    {
        category: 'Digestive System',
        names: ['Anus, Anal Canal and Anorectum']
    },
    {
        category: 'Liver and Intrahepatic Bile Duct',
        names: ['Liver', 'Intrahepatic Bile Duct']
    },
    {
        category: 'Digestive System',
        names: ['Gallbladder', 'Other Biliary', 'Pancreas', 'Retroperitoneum',
            'Peritoneum', 'Omentum and Mesentery', 'Other Digestive Organs']
    },
    {
        category: 'Respiratory System',
        names: ['Nose, Nasal Cavity and Middle Ear',
            'Larynx',
            'Lung and Bronchus',
            'Pleura',
            'Trachea, Mediastinum and Other Respirato']
    },
    {
        category: 'Bones and Joints',
        names: ['Bones and Joints']
    },
    {
        category: 'Soft Tissue',
        names: ['Soft Tissue including Heart']
    },
    {
        category: 'Skin excluding Basal and Squamous',
        names: ['Melanoma of the Skin',
            'Other Non-Epithelial Skin']
    },
    {
        category: 'Breast',
        names: ['Breast']
    },
    {
        category: 'Female Genital System',
        names: ['Cervix Uteri']
    },
    {
        category: 'Corpus and Uterus, NOS',
        names: ['Corpus Uteri',
            'Uterus, NOS']
    },
    {
        category: 'Female Genital System',
        names: ['Ovary',
            'Vagina',
            'Vulva',
            'Other Female Genital Organs']
    },
    {
        category: 'Urinary System',
        names: ['Urinary Bladder',
            'Kidney and Renal Pelvis',
            'Ureter',
            'Other Urinary Organs']
    },
    {
        category: 'Eye and Orbit',
        names: ['Eye and Orbit']
    },
    {
        category: 'Brain and Other Nervous System',
        names: ['Brain',
            'Cranial Nerves Other Nervous System']
    },
    {
        category: 'Endocrine System',
        names: ['Thyroid',
            'Other Endocrine including Thymus']
    },
    {
        category: 'Hodgkin Lymphoma',
        names: ['Hodgkin - Nodal',
            'Hodgkin - Extranodal']
    },
    {
        category: 'Non-Hodgkin Lymphoma',
        names: ['NHL - Nodal',
            'NHL - Extranodal']
    },
    {
        category: 'Myeloma',
        names: ['Myeloma']
    },
    {
        category: 'Lymphocytic Leukemia',
        names: ['Acute Lymphocytic Leukemia',
            'Chronic Lymphocytic Leukemia',
            'Other Lymphocytic Leukemia']
    },
    {
        category: 'Myeloid and Monocytic Leukemia',
        names: ['Acute Myeloid Leukemia',
            'Chronic Myeloid Leukemia',
            'Other Myeloid/Monocytic Leukemia',
            'Acute Monocytic Leukemia']
    },
    {
        category: 'Other Leukemia',
        names: ['Other Acute Leukemia',
            'Aleukemic, subleukemic and NOS']
    },
    {
        category: 'Mesothelioma',
        names: ['Mesothelioma']
    },
    {
        category: 'Kaposi Sarcoma',
        names: ['Kaposi Sarcoma']
    },
    {
        category: 'Miscellaneous',
        names: ['Miscellaneous']
    }
];


const cancer_endpoint_info_columns = [
    {
        title: 'Variable Name',
        dataIndex: 'name',
        width: 200,
        render: (text, row, index) => {
            return {
                props: {
                    style: {fontWeight: 'normal', verticalAlign: 'top', fontSize: 12},
                },
                children: <div>{text}</div>
            };
        }
    }, {
        title: 'Description',
        dataIndex: 'description',
        render: (text, row, index) => {
            return {
                props: {
                    style: {fontWeight: 'normal', verticalAlign: 'top', fontSize: 12},
                },
                children:
                    <div>
                        {
                            text.split('\n').map((string, i) => (
                                <div>{string}</div>
                            ))
                        }
                    </div>
            };
        }
    }
];

const cancer_endpoint_info_data = [
    {
        name: 'DATE_DT',
        description: 'Cancer diagnosis date'
    },
    {
        name: 'SITE_GROUP_NME',
        description: 'This is the site group name for the SEERWHO recode'
    },
    {
        name: 'SEER_ID',
        description: 'Surveillance, Epidemiology, and End Results ( SEER ) program of the National Cancer Institute (NCI)' +
            '\nValues: 20010-99999'
    },
    {
        name: 'HISTOLOGIC_ICDO3_TYP',
        description: 'Tumor histology - The first four digits of the ICD-O-3 morphology code, indicates the histology/cell type of this tumor. Coded directly for cases diagnosed 2001 and forward. Cases coded prior to 2001 were converted to ICDO-3.'
    },
    {
        name: 'ICD_O3_CDE',
        description: 'Tumor site - Location where this tumor originated in as much detail as is known and for which a code is provided in ICD-O-2 for cases 1988-2000 and ICDO-3 for cases 2001 forward.'
    },
    {
        name: 'TUMOR_GRADE_ID',
        description: 'Tumor grade - Sixth digit of ICD-O-3; designates the grade or differentiation of the tumor.'
    },
    {
        name: 'STAGE_CDE',
        description: 'In CCR: STAGE\n' +
            'Combined AJCC stage variable. EOD converted to AJCC 3rd edition stage for cervical, colon, rectum, ovarian, vulva, vagina, and lung cancers for 1994-2003; breast cancer for 1988-2003; CS converted to AJCC 6th edition stage for 2004-2009; CS converted to AJCC 7th edition stage for 2010 and forward.'
    },
    {
        name: 'STAGE_BEHAVIOUR_IND',
        description: 'This is the CCR code used for HISTO_M3 (fifth digit) of the ICD-O-3 or HISTO_M2 (fifth digit) of the ICD-O-2 indicating behavior of the tumor.'
    },
    {
        name: 'STAGE_BEHAVIOUR_NME',
        description: 'This is the descriptive name for the CCR code used for STAGE_BEHAVIOUR_IND'
    },
    {
        name: 'STAGE_SEER_CDE',
        description: 'In CCR: STAGE_SEER\n' +
            'Combined AJCC stage variable. EOD converted to SEER-Modified AJCC 3rd edition stage for cervical, colon, rectum, ovarian, vulva, vagina, and lung cancers for 1994-2003; breast cancer for 1988- 2003; CS converted to AJCC 6th edition stage for 2004-2009; CS converted to AJCC 7th edition stage for 2010 and forward.'
    },
    {
        name: 'CANCER_CONFIRM_IND',
        description: 'In CCR: DXCONF\n' +
            'Indicates whether at any time during the patient’s medical history there was microscopic confirmation of this cancer.'
    },
    {
        name: 'CHEMO_SUM_CDE',
        description: 'In CCR: CHEMOSUM\n' +
            'Identifies the type of chemotherapy given as first course of treatment at any facility, or the reason it was not given. RXDATEC records the date of initation for chemotherapy.'
    },
    {
        name: 'HORM_SUM_CDE',
        description: 'In CCR: HORMSUM\n' +
            'Records whether systemic hormonal agents were given as first course of treatment at any facility, or the reason why they were not given. RXDATEH provides the date hormone therapy started.\n' +
            'TYPEREP indicates which facility had the best source of information about the patient’s neoplasm.'
    },
    {
        name: 'IMMUNO_SUM_CDE',
        description: 'In CCR: IMMUSUM\n' +
            'Records whether systemic immunotherapy was given as first course of treatment at any facility, or the reason why it was not given. RXDATEI records the date of initiation for immunotherapy (a.k.a. biological response modifier) that is part of the first course of treatment.\n' +
            'TYPEREP indicates which facility had the best source of information about the patient’s neoplasm.'
    },
    {
        name: 'OTHER_SUM_CDE',
        description: 'In CCR: OTHSUM\n' +
            'Indicates whether the first course of treatment included other types of therapy. RXDATEO provides the date that the other type of therapy started.'
    },
    {
        name: 'RAD_SUM_CDE',
        description: 'In CCR: RADSUM\n' +
            'Summary of radiation therapy given as first course of treatment. RXDATER identifies the date radiation therapy started.'
    },
    {
        name: 'NORAD_REASON_CDE',
        description: 'In CCR: NORAD\n' +
            'Reason why the first course of treatment did not include radiation.'
    },
    {
        name: 'NOSURG_REASON_CDE',
        description: 'In CCR: NOSURG\n' +
            'Reason why the first course of treatment did not include definitive surgery. Reason for No Surgery only applies to surgery of the primary site.'
    },
    {
        name: 'RAD_SEQ_CDE',
        description: 'In CCR: RADSEQ\n' +
            'Indicates the sequence of radiation therapy with surgery (pre-op, post-op, etc.) during the first course of treatment.'
    },
    {
        name: 'RX_DT',
        description: 'In CCR: RXDATE_CCYYMMDD\n' +
            'In CCR: RXDATE\n' +
            'Date first course of definitive treatment started for this tumor. Based on earliest date reported for surgery, radiation, chemotherapy, hormone therapy, immunotherapy, or transplant/endocrine procedure.'
    },
    {
        name: 'RX_NODATE_CDE',
        description: 'In CCR: DATEOFINITIALRXFLAG\n' +
            'Indicates why there is no appropriate value in the corresponding date field,RXDATE.'
    },
    {
        name: 'RX_CHEMO_DT',
        description: 'In CCR: RXDATEC, RXDATEC_CCYYMMDD\n' +
            'Date chemotherapy started. CHEMOSUM identifies the type of chemotherapy given as first course of treatment.'
    },
    {
        name: 'RX_CHEMO_NODATE_CDE',
        description: 'In CCR: RXDATECHEMOFLAG\n' +
            'Explains why there is no appropriate value in the corresponding date field, RXDATEC.'
    },
    {
        name: 'RX_HORM_DT',
        description: 'In CCR: RXDATEH , RXDATEH_CCYYMMDD\n' +
            'Date hormone therapy started. HORMSUM identifies the type of hormone therapy given as first course of treatment.'
    },
    {
        name: 'RX_HORM_NODATE_CDE',
        description: 'In CCR: RXDATEHORMONEFLAG\n' +
            'Explains why there is no appropriate value in the corresponding date field, RXDATEH.'
    },
    {
        name: 'RX_IMMUNO_DT',
        description: 'In CCR: RXDATEI , RXDATEI_CCYYMMDD\n' +
            'Date immunotherapy started. IMMUSUM identifies the type of immunotherapy given as first course of treatment.'
    },
    {
        name: 'RX_IMMUNO_NODATE_CDE',
        description: 'In CCR: RXDATEBRMFLAG\n' +
            'Explains why there is no appropriate value in the corresponding date field, RXDATEI.'
    },
    {
        name: 'RX_OTHER_DT',
        description: 'In CCR: RXDATEO , RXDATEO_CCYYMMDD\n' +
            'Date other therapy started. OTHSUM identifies the \'other\' type of therapy given as first course of treatment.'
    },
    {
        name: 'RX_OTHER_NODATE_CDE',
        description: 'In CCR: RXDATEOTHERFLAG\n' +
            'This flag explains why there is no appropriate value in the corresponding date field, RXDATEO.'
    },
    {
        name: 'RAD_BOOST_MODE_CDE',
        description: 'In CCR: RADBSTMOD\n' +
            'Identifies the volume or anatomic target of the most clinically significant boost radiation therapy delivered to the patient during the first course of treatment. See also RADREGMOD. Radiation treatment is frequently delivered in two or more phases which can be summarized as “regional” and “boost” treatments. To evaluate patterns of radiation oncology care, it is necessary to know which radiation resources were employed in the delivery of therapy. For outcomes analysis, the modalities used for each of these phases can be very important.'
    },
    {
        name: 'RAD_REGIONAL_MODE_CDE',
        description: 'In CCR: RADREGMOD\n' +
            'Records the dominant modality of radiation therapy used to deliver the most clinically significant regional dose to the primary volume of interest during the first course of treatment. Radiation treatment is frequently delivered in two or more phases which can be summarized as “regional” and “boost” treatments. To evaluate patterns of radiation oncology care, it is necessary to know which radiation resources were employed in the delivery of therapy. For outcomes analysis, the modalities used for each of these phases can be very important.'
    },
    {
        name: 'RX_RAD_DT',
        description: 'In CCR: RXDATER , RXDATER_CCYYMMDD\n' +
            'Date radiation therapy started (including radiation to central nervous system).\n' +
            'RADSUM identifies the type of radiation therapy used for first course of treatment.'
    },
    {
        name: 'RX_RAD_NODATE_CDE',
        description: 'In CCR: RXDATERADIATIONFLAG\n' +
            'This flag explains why there is no appropriate value in the corresponding date field, RXDATER.'
    },
    {
        name: 'RX_STG_PROC_DT',
        description: 'In CCR: RXDATESN , RXDATESN_CCYYMMDD\n' +
            'Date of diagnostic or staging procedure'
    },
    {
        name: 'RX_STG_PROC_NODATE_CDE',
        description: 'In CCR: RXDATEDXSTGPROCFLAG\n' +
            'Date of diagnostic or staging procedure'
    },
    {
        name: 'RX_SYSTEMIC_DT',
        description: 'In CCR: DTSYSTEMIC , DTSYSTEMIC_CCYYMMDD\n' +
            'Records the date of initiation for systemic therapy that is part of the first course of treatment. Systemic therapy is considered to be: chemotherapy agents, hormonal agents, biological response modifiers, bone marrow transplants, stem cell harvests, and surgical and/or radiation endocrine therapy.'
    },
    {
        name: 'RX_SYSTEMIC_NODATE_CDE',
        description: 'In CCR: RXDATESYSTEMICFLAG\n' +
            'This flag explains why there is no appropriate value in the corresponding date field, DTSYSTEMIC'
    },
    {
        name: 'RX_SYSTEMIC_SUM_SEQ_CDE',
        description: 'In CCR: RXSUMMSYSTEMICSURSEQ\n' +
            'Records the sequencing of systemic therapy (Chemosum [1390], Hormsum [1400], Immusum [1410], and transsum [3250]) and surgical procedures given as part of the first course of treatment. For cases with a 2006+ diagnosis date.'
    },
    {
        name: 'NNODES_CDE',
        description: 'In CCR: NNODES\n' +
            'Number of regional lymph nodes identified in the pathology report during surgical procedure- this variable is only valid for cases diagnosed prior to Jan. 2004.\n' +
            'Information in NNODES from 1988-2003 was incorporated into the variable SCOPE.'
    },
    {
        name: 'SURG_SUM_CDE',
        description: 'In CCR: SURG_SUM \n' +
            'Most extensive surgery during first course of RX'
    },
    {
        name: 'SURG_OTHER_CDE',
        description: 'In CCR: SURGOTH \n' +
            'Surgical removal of tissue other than the primary tumor or organ of origin (i.e., regional nodes or distant nodes).'
    },
    {
        name: 'SURG_PRIMARY_CDE',
        description: 'In CCR: SURGPRIM\n' +
            'Most extensive type of surgery performed during the first course of treatment for the tumor.'
    },
    {
        name: 'SURG_RECON_CDE',
        description: 'In CCR: SURGRCON\n' +
            'Most extensive reconstructive surgery performed during first course of treatment, for cases diagnosed before 2003. For cases diagnosed 2003 forward, information was incorporated into SURGPRIM.'
    },
    {
        name: 'SURG_DT',
        description: 'In CCR: SURGDATE , SURGDATE_CCYYMMDD\n' +
            'Date the earliest definitive surgery was performed. Different from DTDEFSURG, which is the date when the most extensive surgery was performed.'
    },
    {
        name: 'SURG_NODATE_CDE',
        description: 'In CCR: RXDATESURGERYFLAG\n' +
            'This flag explains why there is no appropriate value in the corresponding date field, SURGDATE [NAACCR #1200].'
    },
    {
        name: 'SURG_DEFIN_DT',
        description: 'In CCR: DTDEFSURG , DTDEFSURG_CCYYMMDD\n' +
            'Records the date of SURGPRIM, the most definitive surgical resection of the primary site performed as the first course of treatment. Different from SURGDATE, which is the date the earliest surgical procedure was performed. Collected directly from cases diagnosed in 2003 forward. For cases diagnosed from 1998- 2002, date taken from the three surgery fields (which are no longer required).\n' +
            ' Dates before 1997-1998 are mostly unknown. “Valid” means surgery performed; unknown includes no surgery.'
    },
    {
        name: 'SURG_DEFIN_NODATE_CDE',
        description: 'In CCR: RXDATEMSTDEFNSRGFLAG\n' +
            'Explains why there is no appropriate value in the corresponding date field, DTDEFSURG (date of the most definitive surgery).'
    },
    {
        name: 'SURG_OTHER_98_CDE',
        description: 'In CCR: SURGOTH98\n' +
            'Cancer surgery other site, highest 98-00'
    },
    {
        name: 'SURG_PRIMARY_98_CDE',
        description: 'In CCR: SURGPRIM98\n' +
            'CA Surgery primary site, highest 98-00'
    },
    {
        name: 'SCOPE_IND',
        description: 'In CCR: SCOPE\n' +
            'Records surgery removing regional lymph nodes during the first course of treatment. Introduced (required) for cases diagnosed in 2003 forward; for earlier diagnoses information was taken from the variable NNODES.'
    },
    {
        name: 'SCOPE1_CDE',
        description: 'In CCR: SCOPE1\n' +
            'Earliest surgery, scope of nodes'
    },
    {
        name: 'SCOPE2_CDE',
        description: 'In CCR: SCOPE2\n' +
            'Most extensive surgery, scope of nodes'
    },
    {
        name: 'SCOPE3_CDE',
        description: 'In CCR: SCOPE3\n' +
            'Other surgery, scope of nodes'
    },
    {
        name: 'SURG1_DT',
        description: 'In CCR: SURGDT1 , SURGDT1_CCYYMMDD\n' +
            'Date earliest procedure performed (MMDDCCYY)'
    },
    {
        name: 'SURG1_OTHER_CDE',
        description: 'In CCR: SURGO1\n' +
            'Earliest surgery of other site'
    },
    {
        name: 'SURG1_PRIMARY_CDE',
        description: 'In CCR: SURGP1\n' +
            'Earliest surgery of primary site'
    },
    {
        name: 'SURG2_DT',
        description: 'In CCR: SURGDT2 , SURGDT2_CCYYMMDD\n' +
            'Date most extensive surgery of primary site (MMDDCCYY)'
    },
    {
        name: 'SURG2_OTHER_CDE',
        description: 'In CCR: SURGO2\n' +
            'Most extensive surgery of other site'
    },
    {
        name: 'SURG2_PRIMARY_CDE',
        description: 'In CCR: SURGP2\n' +
            'Most extensive surgery of primary site'
    },
    {
        name: 'SURG3_DT',
        description: 'In CCR: SURGDT3 , SURGDT3_CCYYMMDD\n' +
            'Date other cancer surgery primary site (MMDDCCYY)'
    },
    {
        name: 'SURG3_OTHER_CDE',
        description: 'In CCR: SURGO3\n' +
            'Other cancer surgery of other site'
    },
    {
        name: 'SURG3_PRIMARY_CDE',
        description: 'In CCR: SURGP3\n' +
            'Other cancer surgery primary site'
    },
    {
        name: 'TRANSP_DT',
        description: 'In CCR: DTTRANSP , DTTRANSP_CCYYMMDD\n' +
            'Date that TRANSSUM, the transplant/endocrine procedure, was performed. If multiple records exist, consolidation for item involves comparing codes and selecting most extensive procedure. Required for cases diagnosed 2003 and forward.'
    },
    {
        name: 'TRANSP_NODATE_CDE',
        description: 'In CCR: DATETRANSPENDOFLAG\n' +
            'This flag explains why there is no corresponding date in the related field, DTTRANSP.'
    },
    {
        name: 'LATERAL_SITE_CDE',
        description: 'For some specific primary sites, the side of the body in which the tumor originated.'
    },
    {
        name: 'ESTROGEN_RCPTR_IND',
        description: 'Estrogen Receptor Indicator :\n' +
            'Single digit values are from SAS source MARKER1\n' +
            'Multiple digit values are from SAS Source CS_SITE_SPEC_F1\n' +
            'Attribute is null unless SEER Code = 26000'
    },
    {
        name: 'ESTROGEN_RCPTR_DSC',
        description: 'Short descriptions for ESTROGEN receptor status indicator values.\n' +
            'Description created from logic :\n' +
            ' If SEERWHO = 26000 and\n' +
            ' Marker1=3 or CS_SITE_SPEC_F1=030 then "BORDERLINE"\n' +
            ' Marker1=2 or CS_SITE_SPEC_F1=020 then "NEGATIVE"\n' +
            ' Marker1=1 or CS_SITE_SPEC_F1=010 then "POSITIVE"\n' +
            ' Marker1 in (0,8,9) or\n' +
            ' CS_SITE_SPEC_F1 in (996,997,998,999) then "UNKNOWN"'
    },
    {
        name: 'PROGESTERONE_RCPTR_IND',
        description: 'Progesterone Receptor Indicator :\n' +
            'Single digit values are from SAS source MARKER2\n' +
            'Multiple digit values are from SAS Source CS_SITE_SPEC_F2\n' +
            '\n' +
            'Attribute is null unless SEER Code = 26000'
    },
    {
        name: 'PROGESTERONE_RCPTR_DSC',
        description: 'Short descriptions for PROGESTERONE receptor status indicator values.\n' +
            'Description created from logic :\n' +
            ' If SEERWHO = 26000 and\n' +
            ' Marker2=3 or CS_SITE_SPEC_F2=030 then "BORDERLINE"\n' +
            ' Marker2=2 or CS_SITE_SPEC_F2=020 then "NEGATIVE"\n' +
            ' Marker2=1 or CS_SITE_SPEC_F2=010 then "POSITIVE"\n' +
            ' Marker2 in (0,8,9) or\n' +
            ' CS_SITE_SPEC_F2 in (996,997,998,999) then "UNKNOWN"'
    },
    {
        name: 'HER2_RCPTR_IND',
        description: 'HER2 (from human epidermal growth factor receptor 2) or HER2/neu, Receptor Status\n' +
            'Single digit values are from SAS source MARKERCA\n' +
            'Multiple digit values are from SAS Source CSSITESPECIFICFACTOR15\n' +
            '\n' +
            ' Attribute is null unless SEER Code = 26000'
    },
    {
        name: 'HER2_RCPTR_DSC',
        description: 'Short descriptions for HER2 receptor status indicator values.\n' +
            'Description created from logic :\n' +
            ' If SEERWHO = 26000 and\n' +
            ' MarkerCA=3 or CSSITESPECIFICFACTOR15=030 then ""BORDERLINE""\n' +
            ' MarkerCA=2 orCSSITESPECIFICFACTOR15=020 then ""NEGATIVE""\n' +
            ' MarkerCA=1 or CSSITESPECIFICFACTOR15=010 then ""POSITIVE""\n' +
            ' MarkerCA in (0,8,9) or\n' +
            ' CSSITESPECIFICFACTOR15 in (996,997,998,999) then ""UNKNOWN""'
    },
    {
        name: 'PARTICIPANT_KEY',
        description: 'This is the primary key for a CTS participant.'
    },
    {
        name: 'analysis_start_date',
        description: 'This is the analysis start date chosen by the researcher.'
    },
    {
        name: 'analysis_end_date',
        description: 'This date is the minimum of death date, move out of CA date, risk-eliminating surgery date if applicable, diagnosis of interest date, other diagnosis date, or end of follow up date for each participant. Researcher can choose to not include other cancer diagnosis as a censoring criteria.'
    },
    {
        name: 'event',
        description: 'Event to end follow up. Can be used with analysis_end_date to see when and why participant follow-up ended.'
    },
    {
        name: 'case_indicator',
        description: 'A 1/0 indicator of if a row for a participant is a case of the cancer of interest.'
    },
    {
        name: ' end_of_followup_date',
        description: 'This date is either the administrative censoring date or an earlier date, as chosen by the researcher.'
    },
    {
        name: ' first_othercancerdiag_date',
        description: 'Date of first cancer diagnosis that is not the cancer of interest. Used to create the analysis_end_date variable.'
    },
    {
        name: ' first_selectedcancerdiag_date',
        description: 'Date of first cancer diagnosis of the cancer of interest. Used to create the analysis_end_date variable.'
    },
    {
        name: 'HYSTERECTOMY_DT',
        description: 'This is the earliest recorded date a participant had an hysterectomy'
    },
    {
        name: 'HYSTERECTOMY_IND',
        description: 'This is an indicator used to define if a participant had a hysterectomy'
    },
    {
        name: 'BILATERAL_MASTECTOMY_DT',
        description: 'This is the earliest recorded date the participant had a bilateral mastectomy'
    },
    {
        name: 'BILATERAL_MASTECTOMY_IND',
        description: 'This is an indicator used to define if a participant had a bilateral mastectomy'
    },
    {
        name: 'BILATERAL_OOPHORECTOMY_DT',
        description: 'This is the earliest date recorded for a bilateral oophorectomy.\n' +
            'If derived from two separate unilateral oophorectomy surgeries, it is the date from the second surgery\n' +
            'If derived from Questionaire 1 answers, then it is the fill date for the Questionnaire'
    },
    {
        name: 'BILATERAL_OOPHORECTOMY_IND',
        description: 'This is an indicator used to define if a participant had a bilateral oophorectomy'
    },
    {
        name: 'MOVE_DT',
        description: 'Date participant moved out of California'
    },
    {
        name: 'DATE_OF_BIRTH_DT',
        description: 'Participant date of birth'
    },
    {
        name: 'DATE_OF_DEATH_DT',
        description: 'Participant date of death'
    },
    {
        name: 'CAUSE_OF_DEATH_CDE',
        description: 'Cause of death code (typically ICD 9)'
    },
    {
        name: 'CAUSE_OF_DEATH_DSC',
        description: 'Cause of Death description - short code'
    },
    {
        name: 'QNR_1_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'QNR_2_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'QNR_3_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'QNR_4_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'QNR_4_MINI_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'QNR_5_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'QNR_5_MINI_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'QNR_6_FILL_DT',
        description: 'The date the questionnaire was filled out by the participant'
    },
    {
        name: 'BREAST_CANCER_RES_ONLY_IND',
        description: 'This indicator determines which participants should only be used for Breast Cancer only research.'
    },
    {
        name: 'SES_QUARTILE_IND',
        description: 'SES population-based quartiles (A summary SES metric was created incorporating three 1990 census block group variables (occupation, education and income). To do this we first ranked all block groups in the state by level of education (% of adults over the age of 25 completing a college degree or higher), income (median family income), and occupation (% of adults employed in managerial/professional occupations) according to quartiles based on the statewide adult population. This resulted in a score of one through four for each of these SES attributes. We then created a summary SES metric by summing the scores across each of these attributes and categorizing into four groups based on the quartiles of this score for the statewide population.)'
    },
    {
        name: 'BLOCKGROUP90_URBAN_CAT',
        description: 'Urbanization categories of 1990 census block groups'
    }
];

const root_style = {
    width: '100%',
}

let all_options = [];
for (var i = 0; i < site_groups_name.length; i++) {
    all_options.push({value: site_groups_name[i]});
}

let getDistinctValues = (data, name) => {

    let values;
    if (data && data.length > 0) {
        values = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i][name]) {
                var found = false;
                for (var j = 0; j < values.length; j++) {
                    if (values[j].text === data[i][name]) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    values.push({
                        text: data[i][name],
                        value: data[i][name],
                    });
                }
            }
        }
    } else {
        values = null;
    }

    return values;
}

class CancerEndpoint extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            autocomplete_open: false,
            value: '',
            searchInput: '',
            options: [],
            columns: this.getColumns([], []),
            data: [],
            data_backup: [],
            loading: false,
            selected_rows: [],
            selected_rows_backup: [],
            control_checkbox_checked: true,

            auto_values: [],
            showCancerVariables: false
        };
        this.tableRef = React.createRef();
    }

    componentDidMount() {
        if (this.props.project && this.props.project.cancer_endpoint) {
            let cancer_endpoints = JSON.parse(this.props.project.cancer_endpoint);
            if (cancer_endpoints && cancer_endpoints.length > 0) {
                let site_group_name = cancer_endpoints[0].SITE_GROUP_NME;
                this.setState({
                    options: all_options,
                    searchInput: site_group_name,
                    loading: true,
                }, () => {
                    let thisState = this;
                    axios.post('/api/cancer_endpoint', {search: this.state.searchInput})
                        .then(function (response) {
                            let selected_rows = thisState.initSelectedRows(response.data);
                            for (var i = 0; i < cancer_endpoints.length; i++) {
                                for (var j = 0; j < response.data.length; j++) {
                                    if (JSON.stringify(cancer_endpoints[i]) === JSON.stringify(response.data[j])) {
                                        selected_rows[j] = true;
                                        break;
                                    }
                                }
                            }
                            thisState.setState({
                                data: response.data,
                                data_backup: response.data,
                                selected_rows: selected_rows,
                                selected_rows_backup: selected_rows,
                                columns: thisState.getColumns(response.data, response.data),
                                loading: false,
                            });
                        })
                        .catch(function (error) {
                            console.log(error);
                        })
                        .then(function () {
                            // always executed
                        });
                });
            }
        }
    }

    uncheckControlCheckbox = () => {
        let inputElement = document.querySelector("#cancer\\ endpoint-content > div > div > div:nth-child(1) > div > div > div > div > div > div > table > thead > tr > th:nth-child(6) > label > span > input");
        if (inputElement) {
            let spanElement = inputElement.parentElement;
            if (spanElement.classList.contains('ant-checkbox-checked')) {
                inputElement.click();
            }
        }
    }

    reset = () => {
        this.uncheckControlCheckbox();
        this.setState({
            autocomplete_open: false,
            value: '',
            searchInput: '',
            options: all_options,
            columns: this.getColumns([]),
            data: [],
            data_backup: [],
            loading: false,
            selected_rows: [],
            selected_rows_backup: [],
            control_checkbox_checked: false,
            auto_values: []
        });
    }

    onSelect = (data) => {
        //console.log('onSelect', data);
        this.setState({
            searchInput: data
        });

        setTimeout(this.doSearch, 300);
    };

    onChange = (data) => {
        this.setState({
            value: data
        });
    };

    onChangeAutoValues = (values) => {
        //console.log("---------- onChangeAutoValues ----------");
        //console.log("old values: " + JSON.stringify(this.state.auto_values));
        //console.log("new values: " + JSON.stringify(values));

        let old_auto_values = this.state.auto_values;
        this.siteGroupNameSelect.blur();

        this.setState({
            auto_values: values,
            old_auto_values
        }, this.doSearchOnAutoValues);
    }

    doSearchOnAutoValues = () => {

        //console.log("---------- doSearchOnAutoValues ----------");
        //console.log("old values: " + JSON.stringify(this.state.old_auto_values));
        //console.log("new values: " + JSON.stringify(this.state.auto_values));

        // memorize selected data
        let selected_data = [];
        for (var i = 0; i < this.state.data_backup.length - 1; i++) {
            if (this.state.selected_rows_backup[i]) {
                selected_data.push(JSON.stringify(this.state.data_backup[i]));
            }
        }
        //console.log("selected data: " + JSON.stringify(selected_data));

        this.uncheckControlCheckbox();

        this.setState({
            loading: true,
            control_checkbox_checked: false
        });

        let search = [];
        for (i = 0; i < this.state.auto_values.length; i++) {
            search.push(this.state.auto_values[i]);
        }
        //console.log("doSearchOnAutoValues: " + JSON.stringify(search));

        let thisState = this;
        axios.post('/api/cancer_endpoints', {search})
            .then(function (response) {
                //console.log(JSON.stringify(response.data));

                let row_selects = [];
                for (var i = 0; i < response.data.length - 1; i++) {
                    if (selected_data.indexOf(JSON.stringify(response.data[i])) !== -1) {
                        row_selects.push(true);
                    } else {
                        row_selects.push(false);
                    }
                }

                thisState.setState({
                    data: response.data,
                    data_backup: response.data,
                    selected_rows: row_selects,  //thisState.initSelectedRows(response.data),
                    selected_rows_backup: row_selects, //thisState.initSelectedRows(response.data),
                    columns: thisState.getColumns(response.data, response.data),
                    loading: false,
                    control_checkbox_checked: false
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    doSearch = () => {
        console.log("doSearch: " + this.state.searchInput);
        this.uncheckControlCheckbox();

        this.setState({
            loading: true,
            control_checkbox_checked: false
        });

        let thisState = this;
        axios.post('/api/cancer_endpoint', {search: this.state.searchInput})
            .then(function (response) {
                thisState.setState({
                    data: response.data,
                    data_backup: response.data,
                    selected_rows: thisState.initSelectedRows(response.data),
                    selected_rows_backup: thisState.initSelectedRows(response.data),
                    columns: thisState.getColumns(response.data, response.data),
                    loading: false,
                    control_checkbox_checked: false
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    onSearch = searchText => {

        //console.log("onSearch: searchText: ==="+searchText+"---");

        let candidates = [];
        if (searchText) {
            for (var i = 0; i < site_groups_name.length; i++) {
                let option = site_groups_name[i].toLowerCase();
                let text = searchText.trim().toLowerCase();
                if (option.startsWith(text)) {
                    candidates.push({value: site_groups_name[i]});
                    //} else if (option.indexOf(' ' + text) != -1) {
                    //    candidates.push({value: site_groups_name[i]});
                }
            }
        }

        this.setState({
            searchInput: searchText,
            options: !searchText ? all_options : candidates,
        });
    };

    onFocus = () => {
        if (this.state.searchInput === '') {
            this.setState({
                options: all_options
            });
        }
    };

    onTableChange = (pagination, filters, sorter, extra) => {
        //console.log("filter: " + JSON.stringify(filters));
        //console.log("sorter: " + JSON.stringify(sorter));

        this.setState({
            loading: true,
        });

        // memorize selected data
        let selected_data = [];
        for (var i = 0; i < this.state.data_backup.length - 1; i++) {
            if (this.state.selected_rows_backup[i]) {
                selected_data.push(JSON.stringify(this.state.data_backup[i]));
            }
        }

        let thisState = this;
        axios.post('/api/cancer_endpoints',
            {
                //search: this.state.searchInput,
                search: this.state.auto_values,
                filters: filters,
                sorter: sorter
            })
            .then(function (response) {

                let row_selects = [];
                for (var i = 0; i < response.data.length - 1; i++) {
                    if (selected_data.indexOf(JSON.stringify(response.data[i])) !== -1) {
                        row_selects.push(true);
                    } else {
                        row_selects.push(false);
                    }
                }

                thisState.setState({
                    data: response.data,
                    //columns: thisState.getColumns(response.data),
                    columns: thisState.getColumns(response.data, thisState.state.data_backup),
                    selected_rows: row_selects,
                    loading: false,
                }, thisState.saveCancerEndpoint);
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    onGeneralCheckboxChange = (val) => {

        let copy = [...this.state.selected_rows];
        copy.splice(val.target.value, 1, !this.state.selected_rows[val.target.value])
        this.setState({
            selected_rows: copy,
        });

        let result_backup = [];
        for (var j = 0; j < this.state.data_backup.length - 1; j++) {
            if (JSON.stringify(this.state.data[val.target.value]) === JSON.stringify(this.state.data_backup[j])) {
                result_backup.push(!this.state.selected_rows_backup[j]);
            } else {
                result_backup.push(this.state.selected_rows_backup[j]);
            }
        }

        //console.log("selected_rows="+JSON.stringify(result));
        //console.log("selected_rows_backup="+JSON.stringify(result_backup));

        this.setState({
            //selected_rows: result,
            selected_rows_backup: result_backup
        }, this.saveCancerEndpoint);
    }

    onControlCheckboxChange = (val) => {

        this.setState({
            control_checkbox_checked: val.target.checked,
        });

        let result = [];
        for (var i = 0; i < this.state.selected_rows.length; i++) {
            result.push(val.target.checked);
        }

        let result_backup = [];
        for (var j = 0; j < this.state.data_backup.length - 1; j++) {
            var found = false;
            for (i = 0; i < this.state.data.length; i++) {
                if (JSON.stringify(this.state.data[i]) === JSON.stringify(this.state.data_backup[j])) {
                    found = true;
                }
            }
            if (found) {
                result_backup.push(val.target.checked);
            } else {
                result_backup.push(this.state.selected_rows_backup[j]);
            }
        }

        //console.log("selected_rows="+JSON.stringify(result));
        //console.log("selected_rows_backup="+JSON.stringify(result_backup));

        this.setState({
            selected_rows: result,
            selected_rows_backup: result_backup
        }, this.saveCancerEndpoint);
    }

    initSelectedRows = (data) => {
        let result = [];
        for (var i = 0; i < data.length - 1; i++) {
            result.push(false);
        }
        return result;
    }

    saveCancerEndpoint = () => {
        let selected_data = [];
        for (var i = 0; i < this.state.data.length; i++) {
            if (this.state.selected_rows[i]) {
                selected_data.push(this.state.data[i]);
            }
        }
        this.props.save_cancer_endpoint(selected_data);
    }

    setCancerEndpoint = () => {
        let selected_data = [];
        for (var i = 0; i < this.state.data.length; i++) {
            if (this.state.selected_rows[i]) {
                selected_data.push(this.state.data[i]);
            }
        }
        this.props.setup_cancer_endpoint(selected_data);
    }

    reviewCancerVariables = () => {
        this.setState({
            showCancerVariables: true
        });
    }

    handleOk = () => {
        this.setState({
            showCancerVariables: false
        });
    }

    handleCancel = () => {
        this.setState({
            showCancerVariables: false
        });
    }

    getColumns = (data, data_backup) => {

        let thisState = this;
        return [
            {
                title: 'Cancer Site Group',
                dataIndex: 'SITE_GROUP_NME',
                render: (text, row, index) => {
                    if (index === 0 || (index < data.length - 1 && data[index].SITE_GROUP_NME !== data[index - 1].SITE_GROUP_NME)) {
                        var count = 1;
                        for (var i = index + 1; i < data.length; i++) {
                            if (data[i].SITE_GROUP_NME === data[index].SITE_GROUP_NME) {
                                count++;
                            } else {
                                break;
                            }
                        }
                        return {
                            props: {
                                style: {fontWeight: 'normal', verticalAlign: 'top'},
                                rowSpan: count,
                            },
                            children: <div>{text}</div>
                        };
                    } else if (index === data.length - 1) {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                style: {fontWeight: 'bold', verticalAlign: 'top', backgroundColor: '#d8ecf3'},
                                colSpan: 4
                            },
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }

                },
            },
            {
                title: 'SEER Code',
                dataIndex: 'SEER_ID',
                render(text, row, index) {
                    if (index === 0 || (index < data.length - 1 && data[index].SEER_ID !== data[index - 1].SEER_ID)) {
                        var count = 1;
                        for (var i = index + 1; i < data.length; i++) {
                            if (data[i].SEER_ID === data[index].SEER_ID) {
                                count++;
                            } else {
                                break;
                            }
                        }
                        return {
                            props: {
                                style: {fontWeight: 'normal', verticalAlign: 'top'},
                                rowSpan: count,
                            },
                            children: <div>{text}</div>
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }
                }
            },
            {
                title: 'ICD-O-3 Site',
                dataIndex: 'ICD_O3_CDE',
                filters: getDistinctValues(data_backup, 'ICD_O3_CDE'),
                render(text, row, index) {
                    if (index === 0 || (index < data.length - 1 && data[index].ICD_O3_CDE !== data[index - 1].ICD_O3_CDE)) {
                        var count = 1;
                        for (var i = index + 1; i < data.length; i++) {
                            if (data[i].ICD_O3_CDE === data[index].ICD_O3_CDE) {
                                count++;
                            } else {
                                break;
                            }
                        }
                        return {
                            props: {
                                style: {fontWeight: 'normal', verticalAlign: 'top'},
                                rowSpan: count,
                            },
                            children: <div>{text}</div>
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }
                }
            },
            {
                title: 'ICD-O-3 Histology',
                dataIndex: 'HISTOLOGIC_ICDO3_TYP',
                filters: getDistinctValues(data_backup, 'HISTOLOGIC_ICDO3_TYP'),
                render(text, row, index) {
                    if (index < data.length - 1) {
                        return {
                            props: {
                                style: {
                                    fontWeight: 'normal',
                                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f8f8'
                                },
                            },
                            children: <div>{text === '' ? 'Unknown' : text}</div>
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }
                }
            },
            {
                title: 'Total',
                dataIndex: 'TOTAL',
                sorter: (a, b) => {
                },
                render(text, row, index) {
                    return {
                        props: {
                            style: {
                                fontWeight: index === data.length - 1 ? 'bold' : 'normal',
                                backgroundColor: index === data.length - 1 ?
                                    '#d8ecf3' : (index % 2 === 0 ? 'white' : '#f8f8f8')
                            }
                        },
                        children: <div>{text}</div>
                    };
                }
            },
            {
                title: <Checkbox onChange={thisState.onControlCheckboxChange}></Checkbox>,
                width: 50,
                render(text, row, index) {
                    if (index < data.length - 1) {
                        return {
                            props: {
                                style: {
                                    width: '20px',
                                    fontWeight: 'normal',
                                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f8f8',
                                    textAlign: 'left'
                                }
                            },
                            children: <Checkbox
                                value={index}
                                checked={thisState.state.selected_rows.length > index ? thisState.state.selected_rows[index] : false}
                                onChange={thisState.onGeneralCheckboxChange}
                            ></Checkbox>
                        };
                    } else {
                        return {
                            props: {
                                style: {
                                    backgroundColor: '#d8ecf3'
                                }
                            },
                            children: <div></div>
                        };
                    }
                }
            },
        ];
    }

    render() {
        return (
            <div style={root_style}>

                <div style={{margin: '0px 2px 16px 5px', fontWeight: 'bold'}}>

                    <div style={{textAlign: 'right', width: '100%', paddingRight: '10pt'}}>
                        <InfoCircleOutlined onClick={this.reviewCancerVariables} style={{fontSize:20, color:'rgb(57, 116, 207, 0.5)'}}/>
                    </div>

                    <span style={{display: 'flex'}}>
                        <span style={{flex: '0 0 50'}}>
                            <span className="ant-input-group-addon-aux">
                                Cancer Site Group
                            </span>
                        </span>
                        <span style={{flex: '1'}}>
                             <Select mode="multiple"
                                     allowClear="true"
                                     placeholder="Type or click here to select your cancer site group(s)"
                                     value={this.state.auto_values}
                                     ref={(select) => this.siteGroupNameSelect = select}
                                     onChange={this.onChangeAutoValues}
                                     style={{width: '100%'}}>
                                 {categorized_site_group_names.map((group, i) => (
                                     <OptGroup label={group.category} key={'group' + i}>
                                         {group.names.map((name, j) => (
                                             <Option value={name} key={'group-' + i + '-' + j}>
                                                 {name}
                                             </Option>
                                         ))}
                                     </OptGroup>
                                 ))}
                            </Select>
                        </span>
                    </span>

                    <Table
                        columns={this.state.columns}
                        dataSource={this.state.data}
                        size="small"
                        style={{paddingTop: '10pt'}}
                        bordered
                        pagination={false}
                        onChange={this.onTableChange}
                        loading={this.state.loading}
                        rowKey={() => 'key-' + new Date().getTime() + "-" + Math.random()}
                    />
                </div>

                <Modal
                    title="Review Pre-selected Cancer Variables"
                    visible={this.state.showCancerVariables}
                    width="68vw"
                    centered
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="back" onClick={this.handleCancel}>
                            Cancel
                        </Button>,
                    ]}
                >
                    <Table columns={cancer_endpoint_info_columns}
                           dataSource={cancer_endpoint_info_data}
                           size="small"
                           pagination={false}
                           scroll={{y: '60vh'}}
                           bordered
                    />
                </Modal>

            </div>
        );

    }

}

export default CancerEndpoint;
