data "template_file" "bootstrap" {
  template            = "${file("./bootstrap.sh")}"

  vars = {
    docker_compose_file       = "${file("./docker-compose.yml")}"
    oauth2_proxy_config_file  = "${file("./oauth2_proxy.cfg")}"
    credentials_file          = "${file("./credentials.sh")}"
  }
}

resource "aws_instance" "moc-vr" {
  ami           = "${data.aws_ami.ubuntu.id}"
  instance_type = "t2.small"
  key_name      = "gateway"
  user_data     = "${data.template_file.bootstrap.rendered}"
  security_groups        = ["default", "${aws_security_group.moc-vr.name}"]

  tags {
    Name        = "moc-vr"
  }
}

resource "aws_security_group" "moc-vr" {
  name = "moc-vr"
  description = "Allow moc-vr traffic"

  ingress {
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_route53_record" "moc-vr" {
  zone_id       = "Z3USS9SVLB2LY1"
  name          = "moc-vr.informaticslab.co.uk"
  type          = "A"
  ttl           = "60"
  records       = ["${aws_instance.moc-vr.public_ip}"]
}