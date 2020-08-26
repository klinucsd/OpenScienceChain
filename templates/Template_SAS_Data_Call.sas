
/********************************************************************************************************************/
/*  INSTRUCTIONS - PLEASE READ THIS FIRST.																			*/
/*																													*/
/*  The data you requested for your analysis exist in a read-only dataset. 											*/
/*  If/when you update your request, your read-only dataset will be updated. 										*/
/*  																												*/
/*  This code does three things: 																					*/
/* 		1. It reads your data.																						*/
/*		2. It includes some standard code & procedures to help you get started with your data and analysis. 		*/
/* 		3. It can be expanded and saved and copied as you conduct your analysis. 									*/
/*																													*/
/*	There is no need to make copies of your dataset or to save datasets in your project or personal folders.		*/
/*	We encourage you to make temporary or working datasets in your code below.										*/
/* 	This approach--having 1 read-only dataset for your project--reduces data errors & increases data fidelity.		*/
/*																													*/
/*  The standard code & procedures include descriptions of what that code does. 									*/
/*	Feel free to comment-in/comment-out that code as needed for your analysis.										*/
/*																													*/
/*	Save changes to this code in your project folder by adding the date to the file name in the format _MMDDYYYY. 	*/
/********************************************************************************************************************/	

/* 	This code clears the log and output files; comment in or out as you wish										*/
	DM "log;clear;";
	DM "output;clear;";

/*	This section reads your data and creates a working dataset for your analysis.									*/
/* 	Please use this 'analytic_data' as the dataset name, so that a subsequent macro runs correctly					*/
	%Include 'ASSIGN_DATA_TYPE_CODE.SAS';

/* 	Review the contents of your data																				*/
	proc contents data=analytic_data varnum; 
		run;


/*	CTS participants can have multiple records of cancer, before and/or during followup.							*/
/* 	CTS data sources store each episode of cancer as a separate record, meaning some participants have >1 record.	*/
/* 	Depending on your analytic design choices your data may or may not include participants with >1 record.			*/
/* 	Run this code to see whether your data includes 1-row-per-participant or includes participants with >1 record.	*/
/*	Code for pivoting your data to 1-row-per-participants is also below. 											*/
/* 	'Unique_IDs' = # of unique CTS participants (i.e., CTS ID numbers)												*/
/*	'Number_of_Observations' = # of records																			*/
/*	If Unique_IDs < Number_of_Observations then your data includes some participants with multiple records.			*/
	proc sql;
		select count(distinct participant_key) as Unique_IDs,
			count(*) as Number_of_Observations
				from analytic_data;
		quit;

/* 	Count the number of multiple records of cancer																	*/
/* 	Add a counter to enumerate the number of cancer diagnoses for each participant 									*/
/*	The nubmer of participants with cancer_seq>1 should equal the difference between the # of IDs & participants	*/
	data cancers;
		set analytic_data;
			keep participant_key seer_id date_dt icd_o3_cde event;
				where date_dt ne .;
	
		proc sort data=cancers;
			by participant_key date_dt; 
		run;

	data cancer_counts;
 		set cancers;
			cancer_seq + 1;
			by participant_key;
				if first.participant_key then cancer_seq=1;
				if cancer_seq ne . then output;
				label cancer_seq='Numbers of cancers';
	run;
	
/*	Frequency of participants in your analytic data who have multiple records of cancer								*/
	proc freq data=cancer_counts;
		table cancer_seq / missing;
		run;


/* 	This %Include statement runs a macro that pivots your data from multiple records to to one row per participant	*/
/*	The macro code is available in the 'O:\Code\' folder. Estimated run time is approximatley one minute. 			*/
/* 	The macro generates a temporary dataset called 'pivoted' that can be used for regression models below			*/
	%Include 'O:\Code\Transpose Macro.sas';

	proc contents data=pivoted; run;

/*	Does your analysis include participants who had prevalent cancer(s) at baseline?								*/
/* 	If yes, run this section; if no, then skip this section. 														*/
	proc freq data=pivoted;			
		tables prevalent prevalent*event;
		run;

/*	Variable 'event' describes the endpoint and censoring status of participants in your analysis					*/
	proc freq data=pivoted;
		table event / missing;
		run;


/*  PART 1: PERFORM ANALYSIS-SPECIFIC DATA/VARIABLE MANIPULATIONS HERE 												*/
/*  EXAMPLE BELOW SHOWS HOW TO CREATE CATEGORICAL VARIABLE FOR BMI AT CTS BASELINE									*/

	data model_ready;
		set pivoted;

	label case_indicator='1 if participant has cancer endpoint of interest: 0 for all censored participants';
	* CREATE INDICATOR VARIABLE TO IDENTIFY PARTICIPANTS WITH MISSING BMI VALUE AT BASELINE;
	bmi=0;
	if bmi_q1 ne . THEN bmi=1;
	label bmi='Indicator: BMI=1 if known BMI, BMI=0 if BMI missing';

	* CREATE CATEGORICAL VARIABLE FOR WHO BMI CATEGORIES;
	* VALUES INCLUDE MISSING, UNDERWEIGHT, NORMAL WEIGHT, OVERWEIGHT, OBESE, AND SEVERE OBESITY;
	if bmi_q1>=35 then BaselineBMIWHO=6;
	 else if bmi_q1>=30 then BaselineBMIWHO=5;
	 else if bmi_q1>=25 then BaselineBMIWHO=4;
	 else if bmi_q1>=18.5 then BaselineBMIWHO=3;
	 else if bmi_q1>=0 then BaselineBMIWHO=2;
	 else if bmi_q1=. then BaselineBMIWHO=1;
	 label BaselineBMIWHO='1: Missing, 2: <18.5, 3: 18.5-24; 4: 25-29; 5: 30-34; 6: 35+';

	* COLLAPSE BMI VARIABLES;
	if baselineBMIWHO=2 then bmi_group=2;
	 else if baselineBMIWHO=3 then bmi_group=1;
	 else if baselineBMIWHO=4 then bmi_group=3;
	 else if baselineBMIWHO>4 then bmi_group=4;
	 label bmi_group='BMI 18.5-24(1), <18.5(2), 25-29(3), 30+(4)';


	* CREATE AGE AT BASELINE (Q1) IN CATEGORIES;
	if age_at_baseline<40 then age_category=0;
	 else if age_at_baseline<48 then age_category=1;
	 else if age_at_baseline<54 then age_category=2;
	 else if age_at_baseline<64 then age_category=3;
	 else if age_at_baseline>=64 then age_category=4;
	 label age_category='Categorical age at baseline: <40(0), 40-47(1), 48-53(2), 54-63(3), 64+(4)';

	 * CREATE GROUPED RACE VARIABLE;
	 if participant_race=1 then race_group=0;
	  else if participant_race in (2,3,4,5,6) or participant_race=3 or participant_race=4 or participant_race=5 or participant_race=6 then race_group=1;
	  else race_group=2;
	  label race_group='0: White; 1: All other; 2: Missing';

	 * COLLAPSE RACE VARIABLE;
	 if race_group=1 then nonwhite=0;
	  else nonwhite=1;
	  label nonwhite='White=0; non-white/other/unknown=1';

	 * COLLAPSE SES VARIABLE;
	 if ses_quartile_ind in (1,2) then ses_group=0;
	  else if ses_quartile_ind=3 then ses_group=1;
	  else if ses_quartile_ind=4 then ses_group=2;
	  label ses_group='<50th %ile(0), 50th-75th(1), >75th(2)';

	* TO SUMMARIZE THE START & STOP DATES FOR AN ANALYSIS
		analysis_start_date = Date of CTS baseline
		analysis_end_date = Date of end of follow-up for this analysis;

	* CALCULATE FOLLOW-UP TIME AT TIME IN DAYS FROM BASELINE TO END OF FOLLOW-UP;
		followuptime=(analysis_end_date - analysis_start_date)/365.25;


/*  PART 2: RUN UNIVARIATE AND MULTIVARIATE PROCEDURES HERE 														*/
/*	EXAMPLE BELOW SHOWS HOW TO GENERATE FREQUENCIES OF BMI AT BASELINE												*/

	proc univariate data=model_ready;
	 	var followuptime;
	 	run;

	proc freq data=model_ready;
	 	table baselinebmiwho*case_indicator / missing;
		run;


/*  PART 3: RUN PROPORTIONAL HAZARDS REGRESSION HERE																*/
/*	First section provides code for testing the PH assumption														*/
/*
	*FIRST OPTION: TEST THE PROPORTIONAL HAZARDS ASSUMPTION USING SCHOENFLED RESIDUALS;
	PROC PHREG DATA=model_ready 
    	multipass 
		nosummary;
			MODEL followuptime*case_indicator(0)= baselinebmiwho / ties=exact alpha=0.05 rl;
				output out=outdata ressch=schoen;
	RUN;

	ods graphics on/antialiasmax=102000 loessmaxobs=102000;

	PROC SGPLOT data=outdata;
		loess x=followuptime y=schoen /clm;
	RUN;


	*SECOND OPTION: TEST THE PROPORTIONAL HAZARDS ASSUMPTION USING PROC LIFETEST;
	PROC LIFETEST DATA=model_ready
		method=km 
		plots=survival;
	time followuptime*case_indicator(0);
	RUN;
*/

	*ASSUMING NO VIOLATION OF PH ASSUMPTION, RUN MODEL TO GENERATE HRs;
		
	PROC PHREG DATA=model_ready
		multipass 
		nosummary;
			CLASS BaselineBMIWHO (REF='3') race_group (REF='0');
				MODEL followuptime*case_indicator(0)= BaselineBMIWHO race_group / ties=exact alpha=0.05 rl;

	RUN;



