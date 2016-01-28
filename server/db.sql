/*
SQLyog Community v11.1 (64 bit)
MySQL - 5.6.19-log : Database - record
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`record` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `record`;

/*Table structure for table `server_contents` */

DROP TABLE IF EXISTS `server_contents`;

CREATE TABLE `server_contents` (
  `serverId` CHAR(13) NOT NULL COMMENT 'length depend hexChange class',
  `userId` BIGINT(20) DEFAULT NULL,
  `content` VARCHAR(1000) NOT NULL,
  `contentType` VARCHAR(100) DEFAULT NULL,
  `lastLocalTime` BIGINT(20) DEFAULT NULL,
  `state` TINYINT(4) DEFAULT '0',
  `serverUpdateTime` BIGINT(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`serverId`),
  KEY `idx_lastServerUpdateTime` (`serverUpdateTime`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;

/*Table structure for table `server_relations` */

DROP TABLE IF EXISTS `server_relations`;

CREATE TABLE `server_relations` (
  `serverId` CHAR(13) NOT NULL,
  `userId` BIGINT(20) DEFAULT NULL,
  `idFrom` char(13) NOT NULL COMMENT 'no use',
  `idTo` char(13) DEFAULT NULL,
  `state` tinyint(4) DEFAULT '0',
  `serverUpdateTime` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`serverId`),
  KEY `idx_lastServerUpdateTime` (`serverUpdateTime`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

/*Table structure for table `server_users` */

DROP TABLE IF EXISTS `server_users`;

CREATE TABLE `server_users` (
  `userId` bigint(20) NOT NULL,
  `userName` varchar(96) NOT NULL,
  `password` varchar(96) NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `idx-userName` (`userName`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
