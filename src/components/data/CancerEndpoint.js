import React from 'react';
import 'antd/dist/antd.css';
import {Select, Table, Checkbox, Modal, Button} from 'antd';
import {InfoCircleOutlined} from '@ant-design/icons';
import './index.css';
import './cancer_endpoint.css';
import site_groups_name from '../../model/site_group_name';
import axios from 'axios';
import Tooltip from "@material-ui/core/Tooltip/Tooltip";

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
            'Peritoneum, Omentum and Mesentery', 'Other Digestive Organs']
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
                children: <div>{text.toLowerCase()}</div>
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
                                <div key={'row-'+index+'-'+i}>{string}</div>
                            ))
                        }
                    </div>
            };
        }
    }
];

const cancer_endpoint_info_data = [
    {
        name: 'date_dt',
        description: `Cancer diagnosis date`
    },
    {
        name: 'site_group_nme',
        description: `This is the site group name for the SEERWHO recode`
    },
    {
        name: 'seer_id',
        description: `Surveillance, Epidemiology, and End Results ( SEER ) program of the National Cancer Institute (NCI)

Values: 20010-99999`
    },
    {
        name: 'site_sub_cat1_nme',
        description: `This is the Site subcategory name for SEERWHO recode`
    },
    {
        name: 'histologic_icdo2_typ',
        description: `The first four digits of the ICD-O-2 morphology code, indicates the histology/cell type of this tumor.`
    },
    {
        name: 'histologic_icdo3_typ',
        description: `Tumor histology - The first four digits of the ICD-O-3 morphology code, indicates the histology/cell type of this tumor. Coded directly for cases diagnosed 2001 and forward. Cases coded prior to 2001 were converted to ICDO-3.`
    },
    {
        name: 'icd_o3_cde',
        description: `Tumor site - Location where this tumor originated in as much detail as is known and for which a code is provided in ICD-O-2 for cases 1988-2000 and ICDO-3 for cases 2001 forward.`
    },
    {
        name: 'tumor_grade_id',
        description: `Tumor grade - Sixth digit of ICD-O-3; designates the grade or differentiation of the tumor.`
    },
    {
        name: 'stage_cde',
        description: `In CCR: STAGE
Combined AJCC stage variable. EOD converted to AJCC 3rd edition stage for cervical, colon, rectum, ovarian, vulva, vagina, and lung cancers for 1994-2003; breast cancer for 1988-2003; CS converted to AJCC 6th edition stage for 2004-2009; CS converted to AJCC 7th edition stage for 2010 and forward.`
    },
    {
        name: 'stage_behaviour_ind',
        description: `This is the CCR code used for HISTO_M3 (fifth digit) of the ICD-O-3 or HISTO_M2 (fifth digit) of the ICD-O-2 indicating behavior of the tumor.`
    },
    {
        name: 'stage_behaviour_nme',
        description: `This is the descriptive name for the CCR code used for STAGE_BEHAVIOUR_IND`
    },
    {
        name: 'stage_sum_ind',
        description: `In CCR : SUMSTAGE 
Summary stage at time of diagnosis`
    },
    {
        name: 'stage_seer_cde',
        description: `In CCR: STAGE_SEER
Combined AJCC stage variable. EOD converted to SEER-Modified AJCC 3rd edition stage for cervical, colon, rectum, ovarian, vulva, vagina, and lung cancers for 1994-2003; breast cancer for 1988- 2003; CS converted to AJCC 6th edition stage for 2004-2009; CS converted to AJCC 7th edition stage for 2010 and forward.`
    },
    {
        name: 'cancer_confirm_ind',
        description: `In CCR: DXCONF 
Indicates whether at any time during the patient’s medical history there was microscopic confirmation of this cancer.`
    },
    {
        name: 'lag_birth_day_qty',
        description: `Current AGE in days at event`
    },
    {
        name: 'lag_death_day_qty',
        description: `The number of days from this event to the death of the participant.`
    },
    {
        name: 'lag_from_first_event_day_qty',
        description: `This is the difference in days from the current event date and the date of the first event`
    },
    {
        name: 'lag_from_qnr1_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 1`
    },
    {
        name: 'lag_from_qnr2_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 2`
    },
    {
        name: 'lag_from_qnr3_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 3`
    },
    {
        name: 'lag_from_qnr3m_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 3 Mini`
    },
    {
        name: 'lag_from_qnr4_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 4`
    },
    {
        name: 'lag_from_qnr4m_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 4 Mini`
    },
    {
        name: 'lag_from_qnr5_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 5`
    },
    {
        name: 'lag_from_qnr5m_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 5 Mini`
    },
    {
        name: 'lag_from_qnr6_day_qty',
        description: `This is the difference in days from the current event date and the date the participant filled in the Questionnaire 6`
    },
    {
        name: 'lymph_node_pos_nbr_cde',
        description: `In CCR:PNODETU 
Number of regional lymph nodes with evidence of involvement (positive).`
    },
    {
        name: 'tumor_multi_asone_primary_cde',
        description: `In CCR:MULTTUMRPTASONEPRIM 
Identifies cases with multiple tumors that are abstracted and reported as a single primary using the SEER, IARC, or Canadian Cancer Registry multiple primary rules. Multiple tumors may individually exhibit in situ, invasive, or any combination of in situ and invasive behaviors. Multiple intracranial and central nervous system tumors may individually exhibit benign, borderline, malignant, or any combination of these behaviors.
 Multiple tumors found in the same organ or in a single primary site may occur at the time of initial diagnosis or within one year of the initial diagnosis.`
    },
    {
        name: 'tumor_multi_count_cde',
        description: `In CCR:MULTIPLICITYCOUNTER 
This data item is used to count the number of individual reportable tumors (multiplicity) that are present at the time of diagnosis or the number of reportable tumors that occur within one year of the original diagnosis reported as a single primary using the SEER, IARC, or Canadian Cancer Registry multiple primary rules.`
    },
    {
        name: 'chemo_sum_cde',
        description: `In CCR: CHEMOSUM
Identifies the type of chemotherapy given as first course of treatment at any facility, or the reason it was not given. RXDATEC records the date of initation for chemotherapy.`
    },
    {
        name: 'horm_sum_cde',
        description: `In CCR: HORMSUM 
Records whether systemic hormonal agents were given as first course of treatment at any facility, or the reason why they were not given. RXDATEH provides the date hormone therapy started.
TYPEREP indicates which facility had the best source of information about the patient’s neoplasm.`
    },
    {
        name: 'immuno_sum_cde',
        description: `In CCR: IMMUSUM
Records whether systemic immunotherapy was given as first course of treatment at any facility, or the reason why it was not given. RXDATEI records the date of initiation for immunotherapy (a.k.a. biological response modifier) that is part of the first course of treatment.
TYPEREP indicates which facility had the best source of information about the patient’s neoplasm.`
    },
    {
        name: 'other_sum_cde',
        description: `In CCR: OTHSUM 
Indicates whether the first course of treatment included other types of therapy. RXDATEO provides the date that the other type of therapy started.`
    },
    {
        name: 'rad_sum_cde',
        description: `In CCR: RADSUM
Summary of radiation therapy given as first course of treatment. RXDATER identifies the date radiation therapy started.`
    },
    {
        name: 'norad_reason_cde',
        description: `In CCR: NORAD
Reason why the first course of treatment did not include radiation.`
    },
    {
        name: 'nosurg_reason_cde',
        description: `In CCR: NOSURG
Reason why the first course of treatment did not include definitive surgery. Reason for No Surgery only applies to surgery of the primary site.`
    },
    {
        name: 'rad_seq_cde',
        description: `In CCR: RADSEQ
Indicates the sequence of radiation therapy with surgery (pre-op, post-op, etc.) during the first course of treatment.`
    },
    {
        name: 'rx_dt',
        description: `In CCR: RXDATE_CCYYMMDD 
In CCR: RXDATE 
Date first course of definitive treatment started for this tumor. Based on earliest date reported for surgery, radiation, chemotherapy, hormone therapy, immunotherapy, or transplant/endocrine procedure.`
    },
    {
        name: 'rx_nodate_cde',
        description: `In CCR: DATEOFINITIALRXFLAG
Indicates why there is no appropriate value in the corresponding date field,RXDATE.`
    },
    {
        name: 'rx_chemo_dt',
        description: `In CCR: RXDATEC, RXDATEC_CCYYMMDD
Date chemotherapy started. CHEMOSUM identifies the type of chemotherapy given as first course of treatment.`
    },
    {
        name: 'rx_chemo_nodate_cde',
        description: `In CCR: RXDATECHEMOFLAG
Explains why there is no appropriate value in the corresponding date field, RXDATEC.`
    },
    {
        name: 'rx_horm_dt',
        description: `In CCR: RXDATEH , RXDATEH_CCYYMMDD
Date hormone therapy started. HORMSUM identifies the type of hormone therapy given as first course of treatment.`
    },
    {
        name: 'rx_horm_nodate_cde',
        description: `In CCR: RXDATEHORMONEFLAG
Explains why there is no appropriate value in the corresponding date field, RXDATEH.`
    },
    {
        name: 'rx_immuno_dt',
        description: `In CCR: RXDATEI , RXDATEI_CCYYMMDD 
Date immunotherapy started. IMMUSUM identifies the type of immunotherapy given as first course of treatment.`
    },
    {
        name: 'rx_immuno_nodate_cde',
        description: `In CCR: RXDATEBRMFLAG 
Explains why there is no appropriate value in the corresponding date field, RXDATEI.`
    },
    {
        name: 'rx_other_dt',
        description: `In CCR: RXDATEO , RXDATEO_CCYYMMDD 
Date other therapy started. OTHSUM identifies the 'other' type of therapy given as first course of treatment.`
    },
    {
        name: 'rx_other_nodate_cde',
        description: `In CCR: RXDATEOTHERFLAG 
This flag explains why there is no appropriate value in the corresponding date field, RXDATEO.`
    },
    {
        name: 'rad_boost_mode_cde',
        description: `In CCR: RADBSTMOD 
Identifies the volume or anatomic target of the most clinically significant boost radiation therapy delivered to the patient during the first course of treatment. See also RADREGMOD. Radiation treatment is frequently delivered in two or more phases which can be summarized as “regional” and “boost” treatments. To evaluate patterns of radiation oncology care, it is necessary to know which radiation resources were employed in the delivery of therapy. For outcomes analysis, the modalities used for each of these phases can be very important.`
    },
    {
        name: 'rad_regional_mode_cde',
        description: `In CCR: RADREGMOD 
Records the dominant modality of radiation therapy used to deliver the most clinically significant regional dose to the primary volume of interest during the first course of treatment. Radiation treatment is frequently delivered in two or more phases which can be summarized as “regional” and “boost” treatments. To evaluate patterns of radiation oncology care, it is necessary to know which radiation resources were employed in the delivery of therapy. For outcomes analysis, the modalities used for each of these phases can be very important.`
    },
    {
        name: 'rx_rad_dt',
        description: `In CCR: RXDATER , RXDATER_CCYYMMDD
Date radiation therapy started (including radiation to central nervous system).
RADSUM identifies the type of radiation therapy used for first course of treatment.`
    },
    {
        name: 'rx_rad_nodate_cde',
        description: `In CCR: RXDATERADIATIONFLAG 
This flag explains why there is no appropriate value in the corresponding date field, RXDATER.`
    },
    {
        name: 'rx_stg_proc_dt',
        description: `In CCR: RXDATESN , RXDATESN_CCYYMMDD 
Date of diagnostic or staging procedure`
    },
    {
        name: 'rx_stg_proc_nodate_cde',
        description: `In CCR: RXDATEDXSTGPROCFLAG 
Date of diagnostic or staging procedure`
    },
    {
        name: 'rx_systemic_dt',
        description: `In CCR: DTSYSTEMIC , DTSYSTEMIC_CCYYMMDD
Records the date of initiation for systemic therapy that is part of the first course of treatment. Systemic therapy is considered to be: chemotherapy agents, hormonal agents, biological response modifiers, bone marrow transplants, stem cell harvests, and surgical and/or radiation endocrine therapy.`
    },
    {
        name: 'rx_systemic_nodate_cde',
        description: `In CCR: RXDATESYSTEMICFLAG 
This flag explains why there is no appropriate value in the corresponding date field, DTSYSTEMIC`
    },
    {
        name: 'rx_systemic_sum_seq_cde',
        description: `In CCR: RXSUMMSYSTEMICSURSEQ 
Records the sequencing of systemic therapy (Chemosum [1390], Hormsum [1400], Immusum [1410], and transsum [3250]) and surgical procedures given as part of the first course of treatment. For cases with a 2006+ diagnosis date.`
    },
    {
        name: 'nnodes_cde',
        description: `In CCR: NNODES 
Number of regional lymph nodes identified in the pathology report during surgical procedure- this variable is only valid for cases diagnosed prior to Jan. 2004.
Information in NNODES from 1988-2003 was incorporated into the variable SCOPE.`
    },
    {
        name: 'surg_sum_cde',
        description: `In CCR: SURG_SUM 
Most extensive surgery during first course of RX`
    },
    {
        name: 'surg_other_cde',
        description: `In CCR: SURGOTH 
Surgical removal of tissue other than the primary tumor or organ of origin (i.e., regional nodes or distant nodes).`
    },
    {
        name: 'surg_primary_cde',
        description: `In CCR: SURGPRIM 
Most extensive type of surgery performed during the first course of treatment for the tumor.`
    },
    {
        name: 'surg_recon_cde',
        description: `In CCR: SURGRCON 
Most extensive reconstructive surgery performed during first course of treatment, for cases diagnosed before 2003. For cases diagnosed 2003 forward, information was incorporated into SURGPRIM.`
    },
    {
        name: 'surg_dt',
        description: `In CCR: SURGDATE , SURGDATE_CCYYMMDD 
Date the earliest definitive surgery was performed. Different from DTDEFSURG, which is the date when the most extensive surgery was performed.`
    },
    {
        name: 'surg_nodate_cde',
        description: `In CCR: RXDATESURGERYFLAG 
This flag explains why there is no appropriate value in the corresponding date field, SURGDATE [NAACCR #1200].`
    },
    {
        name: 'surg_defin_dt',
        description: `In CCR: DTDEFSURG , DTDEFSURG_CCYYMMDD 
Records the date of SURGPRIM, the most definitive surgical resection of the primary site performed as the first course of treatment. Different from SURGDATE, which is the date the earliest surgical procedure was performed. Collected directly from cases diagnosed in 2003 forward. For cases diagnosed from 1998- 2002, date taken from the three surgery fields (which are no longer required).
 Dates before 1997-1998 are mostly unknown. “Valid” means surgery performed; unknown includes no surgery.`
    },
    {
        name: 'surg_defin_nodate_cde',
        description: `In CCR: RXDATEMSTDEFNSRGFLAG 
Explains why there is no appropriate value in the corresponding date field, DTDEFSURG (date of the most definitive surgery).`
    },
    {
        name: 'surg_other_98_cde',
        description: `In CCR: SURGOTH98 
Cancer surgery other site, highest 98-00`
    },
    {
        name: 'surg_primary_98_cde',
        description: `In CCR: SURGPRIM98 
CA Surgery primary site, highest 98-00`
    },
    {
        name: 'scope_ind',
        description: `In CCR: SCOPE 
Records surgery removing regional lymph nodes during the first course of treatment. Introduced (required) for cases diagnosed in 2003 forward; for earlier diagnoses information was taken from the variable NNODES.`
    },
    {
        name: 'scope1_cde',
        description: `In CCR: SCOPE1 
Earliest surgery, scope of nodes`
    },
    {
        name: 'scope2_cde',
        description: `In CCR: SCOPE2 
Most extensive surgery, scope of nodes`
    },
    {
        name: 'scope3_cde',
        description: `In CCR: SCOPE3 
Other surgery, scope of nodes`
    },
    {
        name: 'surg1_dt',
        description: `In CCR: SURGDT1 , SURGDT1_CCYYMMDD 
Date earliest procedure performed (MMDDCCYY)`
    },
    {
        name: 'surg1_other_cde',
        description: `In CCR: SURGO1 
Earliest surgery of other site`
    },
    {
        name: 'surg1_primary_cde',
        description: `In CCR: SURGP1 
Earliest surgery of primary site`
    },
    {
        name: 'surg2_dt',
        description: `In CCR: SURGDT2 , SURGDT2_CCYYMMDD
Date most extensive surgery of primary site (MMDDCCYY)`
    },
    {
        name: 'surg2_other_cde',
        description: `In CCR: SURGO2 
Most extensive surgery of other site`
    },
    {
        name: 'surg2_primary_cde',
        description: `In CCR: SURGP2 
Most extensive surgery of primary site`
    },
    {
        name: 'surg3_dt',
        description: `In CCR: SURGDT3 , SURGDT3_CCYYMMDD 
Date other cancer surgery primary site (MMDDCCYY)`
    },
    {
        name: 'surg3_other_cde',
        description: `In CCR: SURGO3 
Other cancer surgery of other site`
    },
    {
        name: 'surg3_primary_cde',
        description: `In CCR: SURGP3 
Other cancer surgery primary site`
    },
    {
        name: 'transp_dt',
        description: `In CCR: DTTRANSP , DTTRANSP_CCYYMMDD 
Date that TRANSSUM, the transplant/endocrine procedure, was performed. If multiple records exist, consolidation for item involves comparing codes and selecting most extensive procedure. Required for cases diagnosed 2003 and forward.`
    },
    {
        name: 'transp_nodate_cde',
        description: `In CCR: DATETRANSPENDOFLAG 
This flag explains why there is no corresponding date in the related field, DTTRANSP.`
    },
    {
        name: 'lateral_site_cde',
        description: `For some specific primary sites, the side of the body in which the tumor originated.`
    },
    {
        name: 'estrogen_rcptr_ind',
        description: `Estrogen Receptor Indicator :
Single digit values are from SAS source MARKER1
Multiple digit values are from SAS Source CS_SITE_SPEC_F1
Attribute is null unless SEER Code = 26000`
    },
    {
        name: 'estrogen_rcptr_dsc',
        description: `Short descriptions for ESTROGEN receptor status indicator values.
Description created from logic :
 If SEERWHO = 26000 and 
 Marker1=3 or CS_SITE_SPEC_F1=030 then "BORDERLINE"
 Marker1=2 or CS_SITE_SPEC_F1=020 then "NEGATIVE"
 Marker1=1 or CS_SITE_SPEC_F1=010 then "POSITIVE"
 Marker1 in (0,8,9) or 
 CS_SITE_SPEC_F1 in (996,997,998,999) then "UNKNOWN"`
    },
    {
        name: 'progesterone_rcptr_ind',
        description: `Progesterone Receptor Indicator :
Single digit values are from SAS source MARKER2
Multiple digit values are from SAS Source CS_SITE_SPEC_F2

Attribute is null unless SEER Code = 26000`
    },
    {
        name: 'progesterone_rcptr_dsc',
        description: `Short descriptions for PROGESTERONE receptor status indicator values.
Description created from logic :
 If SEERWHO = 26000 and 
 Marker2=3 or CS_SITE_SPEC_F2=030 then "BORDERLINE"
 Marker2=2 or CS_SITE_SPEC_F2=020 then "NEGATIVE"
 Marker2=1 or CS_SITE_SPEC_F2=010 then "POSITIVE"
 Marker2 in (0,8,9) or 
 CS_SITE_SPEC_F2 in (996,997,998,999) then "UNKNOWN"`
    },
    {
        name: 'her2_rcptr_ind',
        description: `HER2 (from human epidermal growth factor receptor 2) or HER2/neu, Receptor Status 
Single digit values are from SAS source MARKERCA
Multiple digit values are from SAS Source CSSITESPECIFICFACTOR15

 Attribute is null unless SEER Code = 26000`
    },
    {
        name: 'her2_rcptr_dsc',
        description: `Short descriptions for HER2 receptor status indicator values.
Description created from logic :
 If SEERWHO = 26000 and 
 MarkerCA=3 or CSSITESPECIFICFACTOR15=030 then "BORDERLINE"
 MarkerCA=2 orCSSITESPECIFICFACTOR15=020 then "NEGATIVE"
 MarkerCA=1 or CSSITESPECIFICFACTOR15=010 then "POSITIVE"
 MarkerCA in (0,8,9) or 
 CSSITESPECIFICFACTOR15 in (996,997,998,999) then "UNKNOWN"`
    },
    {
        name: 'participant_key',
        description: `This is the unique identifier for each CTS participant`
    },
    {
        name: 'date_of_birth_dt',
        description: `Participant date of birth`
    },
    {
        name: 'date_of_death_dt',
        description: `Participant date of death`
    },
    {
        name: 'cause_of_death_cde',
        description: `Cause of death code (typically ICD 9)`
    },
    {
        name: 'cause_of_death_dsc',
        description: `Cause of Death description - short code`
    },
    {
        name: 'qnr_1_fill_dt',
        description: `Date questionnaire 1 was filled out by the participant`
    },
    {
        name: 'qnr_2_fill_dt',
        description: `Date questionnaire 2 was filled out by the participant`
    },
    {
        name: 'qnr_3_fill_dt',
        description: `Date questionnaire 3 was filled out by the participant`
    },
    {
        name: 'qnr_4_fill_dt',
        description: `Date questionnaire 4 was filled out by the participant`
    },
    {
        name: 'qnr_4_mini_fill_dt',
        description: `Date questionnaire 4 mini was filled out by the participant`
    },
    {
        name: 'qnr_5_fill_dt',
        description: `Date questionnaire 5 was filled out by the participant`
    },
    {
        name: 'qnr_5_mini_fill_dt',
        description: `Date questionnaire 5 mini was filled out by the participant`
    },
    {
        name: 'qnr_6_fill_dt',
        description: `Date questionnaire 6 was filled out by the participant`
    },
    {
        name: 'breast_cancer_res_only_ind',
        description: `This indicator determines which participants should only be used for Breast Cancer only research.`
    },
    {
        name: 'ses_quartile_ind',
        description: `SES population-based quartiles (A summary SES metric was created incorporating three 1990 census block group variables (occupation, education and income). To do this we first ranked all block groups in the state by level of education (% of adults over the age of 25 completing a college degree or higher), income (median family income), and occupation (% of adults employed in managerial/professional occupations) according to quartiles based on the statewide adult population. This resulted in a score of one through four for each of these SES attributes. We then created a summary SES metric by summing the scores across each of these attributes and categorizing into four groups based on the quartiles of this score for the statewide population.)`
    },
    {
        name: 'blockgroup90_urban_cat',
        description: `Urbanization categories of 1990 census block groups`
    },
    {
        name: 'hysterectomy_dt',
        description: `This is the earliest recorded date a participant had an hysterectomy`
    },
    {
        name: 'hysterectomy_ind',
        description: `This is an indicator used to define if a participant had a hysterectomy`
    },
    {
        name: 'bilateral_mastectomy_dt',
        description: `This is the earliest recorded date the participant had a bilateral mastectomy`
    },
    {
        name: 'bilateral_mastectomy_ind',
        description: `This is an indicator used to define if a participant had a bilateral mastectomy`
    },
    {
        name: 'bilateral_oophorectomy_dt',
        description: `This is the earliest date recorded for a bilateral oophorectomy.
If derived from two separate unilateral oophorectomy surgeries, it is the date from the second surgery
If derived from Questionaire 1 answers, then it is the fill date for the Questionnaire`
    },
    {
        name: 'bilateral_oophorectomy_ind',
        description: `This is an indicator used to define if a participant had a bilateral oophorectomy`
    },
    {
        name: 'first_moveout_ca_dt',
        description: `Date that participant moved out of California. Only state moves longer than 4 months were considered as true moves in an attempt to avoid vacations, temporary moves or relative/family moves.`
    },
    {
        name: 'case_indicator',
        description: `This indicator marks cases of the cancer of interest at the row level. If your selections do not include multiple cancers, this will mark participants with the cancer of interest. If your selections include multiple cancers per participant, this indicator will mark which of their cancers is or is not your cancer of interest.`
    },
    {
        name: 'analysis_start_date',
        description: `Analysis start date is either the fill date of the first CTS questionnaire or another date as selected by the researcher.`
    },
    {
        name: 'end_of_followup_date',
        description: `The end of follow-up date is either the current administrative censoring date, or an earlier date as selected by the researcher.`
    },
    {
        name: 'firstothercancer_date',
        description: `The first diagnosis date within the chosen analytic time frame for a cancer that is not the cancer of interest.`
    },
    {
        name: 'firstselectedcancer_date',
        description: `The first diagnosis date within the chosen analytic time frame for the selected cancer of interest.`
    },
    {
        name: 'analysis_end_date',
        description: `The analysis end date is the date follow-up ends for a participant. Follow-up ends at diagnosis with any other cancer; diagnosis of the cancer of interest; death; move out of CA; if applicable, risk-eliminating surgery (hysterectomy, bilateral oophorectomy, or bilateral mastectomy for analyses of uterine, ovarian, or breast cancers, respectively); or the end of follow-up date. Research can choose to not include other cancer diagnosis as a censoring criteria.`
    },
    {
        name: 'event',
        description: `The event that ends a participant's follow-up. This is the event that occurs on the analysis_end_date.`
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

    static getTitle = () => {
        return 'Select cancer endpoint';
    }

    static isComplete = (state) => {
        return state.cancer_endpoint && state.cancer_endpoint.length > 0;
    }

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

                let values = [];
                for (var i=0; i<cancer_endpoints.length; i++) {
                    if (!values.includes(cancer_endpoints[i].SITE_GROUP_NME)) {
                        values.push(cancer_endpoints[i].SITE_GROUP_NME);
                    }
                }

                // setup selected data
                let selected_data = [];
                for (i=0; i<cancer_endpoints.length; i++) {
                    //console.log("setup: " + JSON.stringify(cancer_endpoints[i]));
                    selected_data.push(JSON.stringify(cancer_endpoints[i]));
                }
                //console.log("selected data: " + JSON.stringify(selected_data));

                this.uncheckControlCheckbox();

                this.setState({
                    options: all_options,
                    loading: true,
                    auto_values: values,
                    old_auto_values: values,
                    control_checkbox_checked: false
                }, () => {
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
                                //console.log("is selected: " + JSON.stringify(response.data[i]));
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
                });



                /*
                let site_group_name = cancer_endpoints[0].SITE_GROUP_NME;
                this.setState({
                    options: all_options,
                    searchInput: site_group_name,
                    loading: true,
                    auto_values: values,
                    old_auto_values: values,
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
                 */
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
                        <Tooltip title="Review Pre-selected Cancer Variables">
                            <InfoCircleOutlined onClick={this.reviewCancerVariables}
                                                style={{fontSize: 20, color: 'rgb(57, 116, 207, 0.5)'}}/>
                        </Tooltip>
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
                           rowKey={() => 'info-' + new Date().getTime() + "-" + Math.random()}
                    />
                </Modal>

            </div>
        );

    }

}

export default CancerEndpoint;
