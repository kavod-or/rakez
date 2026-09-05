from django.db import models


class Service(models.Model):
    name = models.CharField(max_length=120, unique=True)
    color = models.CharField(max_length=7, default="#3D7A6C")

    def __str__(self):
        return self.name
