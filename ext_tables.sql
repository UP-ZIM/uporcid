#
# Table structure for table 'tt_content'
#
CREATE TABLE tt_content(
        contactoricidbox_style varchar(255) DEFAULT '' NOT NULL,
        contactorcid_id varchar(255) DEFAULT '' NOT NULL,
        contactorcid_front_style varchar(255) DEFAULT '' NOT NULL,
        
);

#
# Table structure for table 'tx_orcid'
#
CREATE TABLE tx_orcid (
	uid int(11) NOT NULL auto_increment,

	orcid_id varchar(255) DEFAULT '' NOT NULL,
	orcid_data longtext DEFAULT '' NOT NULL,
	
	tstamp int(11) unsigned DEFAULT '0' NOT NULL,
	crdate int(11) unsigned DEFAULT '0' NOT NULL,

	PRIMARY KEY (uid),
);

#
# Table structure for table 'tx_orcid_workdata'
#
CREATE TABLE tx_orcid_workdata (
	uid int(11) NOT NULL auto_increment,
	
	orcid_workput_code varchar(255) DEFAULT '' NOT NULL,
	orcid_id varchar(255) DEFAULT '' NOT NULL,
	orcid_work_date varchar(255) DEFAULT '',
	orcid_work_data longtext DEFAULT '' NOT NULL,
	
	tstamp int(11) unsigned DEFAULT '0' NOT NULL,
	crdate int(11) unsigned DEFAULT '0' NOT NULL,

	PRIMARY KEY (uid),
	UNIQUE KEY orcid_workput_code(orcid_workput_code),
);

#
# Table structure for table 'tx_orcid_page'
#
CREATE TABLE tx_orcid_page (
	uid int(11) NOT NULL auto_increment,
	pid int(11) DEFAULT '0' NOT NULL,

	orcid_id varchar(255) DEFAULT '' NOT NULL,
	orcid_id_data int(11) DEFAULT '0' NOT NULL,

	tstamp int(11) unsigned DEFAULT '0' NOT NULL,
	crdate int(11) unsigned DEFAULT '0' NOT NULL,
	cruser_id int(11) unsigned DEFAULT '0' NOT NULL,
	deleted tinyint(4) unsigned DEFAULT '0' NOT NULL,

	t3ver_oid int(11) DEFAULT '0' NOT NULL,
	t3ver_id int(11) DEFAULT '0' NOT NULL,
	t3ver_wsid int(11) DEFAULT '0' NOT NULL,
	t3ver_label varchar(255) DEFAULT '' NOT NULL,
	t3ver_state tinyint(4) DEFAULT '0' NOT NULL,
	t3ver_stage int(11) DEFAULT '0' NOT NULL,
	t3ver_count int(11) DEFAULT '0' NOT NULL,
	t3ver_tstamp int(11) DEFAULT '0' NOT NULL,
	t3ver_move_id int(11) DEFAULT '0' NOT NULL,
	t3_origuid int(11) DEFAULT '0' NOT NULL,

	PRIMARY KEY (uid),
	KEY parent (pid),
	KEY t3ver_oid (t3ver_oid,t3ver_wsid)
);
